// ============================================================
// FORGE — Generación de rutinas por objetivo
//
// Lógica pura (sin Supabase): dado un objetivo, un nivel, los días/semana
// y el catálogo de ejercicios, arma un split semanal de rutinas filtrando
// por grupo muscular. La capa de base de datos vive en hooks/useRoutines.js.
// ============================================================

import { Flame, Dumbbell, Zap, Activity, Heart } from 'lucide-react'

export const GOAL_LABELS = {
  lose_fat: 'Perder grasa',
  gain_muscle: 'Ganar músculo',
  strength: 'Fuerza',
  endurance: 'Resistencia',
  health: 'Salud general',
}

// Objetivos seleccionables (onboarding + edición de perfil).
export const GOALS = [
  { value: 'gain_muscle', label: 'Ganar músculo', icon: Dumbbell },
  { value: 'lose_fat', label: 'Perder grasa', icon: Flame },
  { value: 'strength', label: 'Fuerza', icon: Zap },
  { value: 'endurance', label: 'Resistencia', icon: Activity },
  { value: 'health', label: 'Salud general', icon: Heart },
]

// Días de entrenamiento por semana seleccionables.
export const TRAINING_DAYS = [2, 3, 4, 5, 6, 7]

// Máximo de objetivos que un usuario puede seleccionar a la vez.
export const MAX_GOALS = 3

// Esquema series/reps/descanso según el objetivo. `compound` aplica a los
// movimientos básicos (multiarticulares); `accessory` al trabajo de aislamiento.
const GOAL_SCHEME = {
  strength: { compound: { sets: 5, reps: 5, rest: 180 }, accessory: { sets: 3, reps: 8, rest: 120 } },
  gain_muscle: { compound: { sets: 4, reps: 8, rest: 120 }, accessory: { sets: 3, reps: 12, rest: 75 } },
  lose_fat: { compound: { sets: 3, reps: 12, rest: 60 }, accessory: { sets: 3, reps: 15, rest: 45 } },
  endurance: { compound: { sets: 3, reps: 15, rest: 45 }, accessory: { sets: 2, reps: 20, rest: 30 } },
  health: { compound: { sets: 3, reps: 10, rest: 90 }, accessory: { sets: 2, reps: 12, rest: 60 } },
}

// El nivel ajusta el volumen: principiante hace menos series, avanzado una más.
const LEVEL_SETS_DELTA = { beginner: -1, intermediate: 0, advanced: 1 }

// Prioridad de equipo al elegir un ejercicio: primero los básicos con barra y
// peso corporal, después mancuerna, y al final máquina/polea (más de aislamiento).
const EQUIPMENT_RANK = { Barbell: 0, Bodyweight: 1, Dumbbell: 2, Machine: 3, Cable: 4 }

// Mapea el nivel de actividad del perfil a un nivel de entrenamiento.
export function levelFromActivity(activityLevel) {
  if (activityLevel === 'sedentary' || activityLevel === 'light') return 'beginner'
  if (activityLevel === 'very_active') return 'advanced'
  return 'intermediate'
}

// Etiqueta legible del split según los días por semana.
export function splitLabel(daysPerWeek) {
  const d = clampDays(daysPerWeek)
  if (d <= 2) return 'Full Body'
  if (d === 3) return 'Push · Pull · Piernas'
  if (d === 4) return 'Tren superior / inferior'
  if (d === 5) return 'PPL + Superior/Inferior'
  return 'Push · Pull · Piernas (x2)'
}

// ── Plantillas de día ──────────────────────────────────────
// Cada slot apunta a uno o varios grupos musculares (nombres en inglés, como en
// muscle_groups), cuántos ejercicios tomar y si son básicos o de aislamiento.
const DAY = {
  push: {
    name: 'Push',
    category: 'PPL',
    focus: 'push',
    slots: [
      { muscles: ['Chest'], count: 2, compound: true },
      { muscles: ['Shoulders'], count: 1, compound: true },
      { muscles: ['Triceps'], count: 1, compound: false },
    ],
  },
  pull: {
    name: 'Pull',
    category: 'PPL',
    focus: 'pull',
    slots: [
      { muscles: ['Lats', 'Trapezius'], count: 2, compound: true },
      { muscles: ['Biceps'], count: 1, compound: false },
      { muscles: ['Shoulders'], count: 1, compound: false },
    ],
  },
  legs: {
    name: 'Piernas',
    category: 'PPL',
    focus: 'legs',
    slots: [
      { muscles: ['Quads'], count: 2, compound: true },
      { muscles: ['Hamstrings', 'Glutes'], count: 1, compound: true },
      { muscles: ['Calves', 'Soleus'], count: 1, compound: false },
      { muscles: ['Abs', 'Obliquus externus abdominis'], count: 1, compound: false },
    ],
  },
  upper: {
    name: 'Tren superior',
    category: 'Upper Lower',
    focus: 'upper_body',
    slots: [
      { muscles: ['Chest'], count: 1, compound: true },
      { muscles: ['Lats', 'Trapezius'], count: 2, compound: true },
      { muscles: ['Shoulders'], count: 1, compound: true },
      { muscles: ['Biceps'], count: 1, compound: false },
      { muscles: ['Triceps'], count: 1, compound: false },
    ],
  },
  lower: {
    name: 'Tren inferior',
    category: 'Upper Lower',
    focus: 'lower_body',
    slots: [
      { muscles: ['Quads'], count: 2, compound: true },
      { muscles: ['Hamstrings', 'Glutes'], count: 2, compound: true },
      { muscles: ['Calves', 'Soleus'], count: 1, compound: false },
      { muscles: ['Abs', 'Obliquus externus abdominis'], count: 1, compound: false },
    ],
  },
  full: {
    name: 'Full Body',
    category: 'Full Body',
    focus: 'full_body',
    slots: [
      { muscles: ['Quads', 'Hamstrings', 'Glutes'], count: 1, compound: true },
      { muscles: ['Chest'], count: 1, compound: true },
      { muscles: ['Lats', 'Trapezius'], count: 1, compound: true },
      { muscles: ['Shoulders'], count: 1, compound: true },
      { muscles: ['Biceps', 'Triceps'], count: 1, compound: false },
      { muscles: ['Abs', 'Obliquus externus abdominis'], count: 1, compound: false },
    ],
  },
}

function clampDays(days) {
  return Math.min(Math.max(Math.round(Number(days) || 3), 1), 7)
}

// `variant` ('A' | 'B') añade sufijo al nombre y desplaza la selección de
// ejercicios, para que los días repetidos no queden idénticos.
function mk(base, variant) {
  return {
    ...base,
    name: variant ? `${base.name} ${variant}` : base.name,
    variant: variant === 'B' ? 1 : 0,
  }
}

// Construye la lista ordenada de días según la frecuencia semanal.
function buildSplit(daysPerWeek) {
  const d = clampDays(daysPerWeek)
  const splits = {
    1: [mk(DAY.full)],
    2: [mk(DAY.full, 'A'), mk(DAY.full, 'B')],
    3: [mk(DAY.push), mk(DAY.pull), mk(DAY.legs)],
    4: [mk(DAY.upper, 'A'), mk(DAY.lower, 'A'), mk(DAY.upper, 'B'), mk(DAY.lower, 'B')],
    5: [mk(DAY.push), mk(DAY.pull), mk(DAY.legs), mk(DAY.upper), mk(DAY.lower)],
    6: [mk(DAY.push, 'A'), mk(DAY.pull, 'A'), mk(DAY.legs, 'A'), mk(DAY.push, 'B'), mk(DAY.pull, 'B'), mk(DAY.legs, 'B')],
    7: [mk(DAY.push, 'A'), mk(DAY.pull, 'A'), mk(DAY.legs, 'A'), mk(DAY.push, 'B'), mk(DAY.pull, 'B'), mk(DAY.legs, 'B'), mk(DAY.full)],
  }
  return splits[d]
}

// Fisher-Yates: mezcla sin mutar el array original.
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Agrupa el catálogo por grupo muscular. Dentro de cada pool se respeta la
// prioridad de equipo (barra > peso corporal > mancuerna > máquina > polea),
// pero el orden dentro de cada nivel se mezcla en cada llamada: así la
// preferencia de equipo se mantiene y a la vez cada generación varía.
function buildPools(exercises) {
  const pools = {}
  for (const ex of exercises) {
    const muscleName = ex.muscle_groups?.name ?? ex.primary_muscles?.[0]
    if (!muscleName) continue
    const item = { id: ex.id, name: ex.name, equipment: ex.equipment, muscleName }
    ;(pools[muscleName] ??= []).push(item)
  }
  for (const key of Object.keys(pools)) {
    const tiers = new Map()
    for (const item of pools[key]) {
      const rank = EQUIPMENT_RANK[item.equipment] ?? 9
      if (!tiers.has(rank)) tiers.set(rank, [])
      tiers.get(rank).push(item)
    }
    pools[key] = [...tiers.keys()]
      .sort((a, b) => a - b)
      .flatMap((rank) => shuffle(tiers.get(rank)))
  }
  return pools
}

function countFor(slot, level) {
  if (level === 'beginner') return slot.compound ? Math.min(slot.count, 2) : 1
  if (level === 'advanced') return slot.compound ? slot.count + 1 : slot.count
  return slot.count
}

function clampSets(n) {
  return Math.min(Math.max(n, 2), 6)
}

// Elige `n` ejercicios para un slot, sin repetir los ya usados en el día.
// `variant` desplaza el punto de partida para variar entre días A/B.
// `excludeIds` son ejercicios de la última rutina generada: se evitan si
// quedan suficientes alternativas para el slot, para no repetir de una
// generación a la siguiente.
function pickExercises(pools, muscles, n, variant, used, excludeIds) {
  const candidates = []
  for (const m of muscles) {
    for (const ex of pools[m] ?? []) candidates.push(ex)
  }
  if (candidates.length === 0) return []

  const fresh = excludeIds ? candidates.filter((ex) => !excludeIds.has(ex.id)) : candidates
  const ordered = fresh.length >= n ? fresh : candidates

  const result = []
  const offset = variant ? Math.floor(ordered.length / 2) : 0
  for (let i = 0; i < ordered.length && result.length < n; i++) {
    const ex = ordered[(i + offset) % ordered.length]
    if (used.has(ex.id)) continue
    used.add(ex.id)
    result.push(ex)
  }
  return result
}

/**
 * Arma el split semanal de rutinas.
 *
 * @param {Object}   params
 * @param {string}   params.goal         lose_fat | gain_muscle | strength | endurance | health
 * @param {string}   params.level        beginner | intermediate | advanced
 * @param {number}   params.daysPerWeek  1..7
 * @param {Array}    params.exercises    catálogo: { id, name, equipment, primary_muscles, muscle_groups:{name} }
 * @param {Set}      [params.excludeIds] ids de ejercicios de la última generación, a evitar si hay alternativas
 * @returns {Array}  rutinas: [{ name, category, description, exercises: [{ exercise_id, name, muscle, sets, reps, rest_seconds }] }]
 */
export function planSplit({ goal, level = 'intermediate', daysPerWeek, exercises, excludeIds }) {
  const scheme = GOAL_SCHEME[goal] ?? GOAL_SCHEME.health
  const goalLabel = GOAL_LABELS[goal] ?? GOAL_LABELS.health
  const days = buildSplit(daysPerWeek)
  const pools = buildPools(exercises ?? [])
  const setsDelta = LEVEL_SETS_DELTA[level] ?? 0

  return days
    .map((day) => {
      const used = new Set()
      const picked = []
      for (const slot of day.slots) {
        const n = countFor(slot, level)
        const chosen = pickExercises(pools, slot.muscles, n, day.variant, used, excludeIds)
        const s = slot.compound ? scheme.compound : scheme.accessory
        for (const ex of chosen) {
          picked.push({
            exercise_id: ex.id,
            name: ex.name,
            muscle: ex.muscleName,
            sets: clampSets(s.sets + setsDelta),
            reps: s.reps,
            rest_seconds: s.rest,
          })
        }
      }
      return {
        name: day.name,
        category: day.category,
        focus: day.focus,
        description: `Generada para ${goalLabel}`,
        exercises: picked,
      }
    })
    .filter((routine) => routine.exercises.length > 0)
}
