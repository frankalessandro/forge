import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getCurrentUserId } from '../stores/authStore'
import { displayWeight } from '../utils/weight'

// Ejercicios con logros de categoría específica. Se referencian por `slug`
// (estable, ver 20260701000001_exercises_achievement_slug.sql) en vez de por
// `name`: si el ejercicio se renombra en el catálogo, el logro sigue
// trackeándose en vez de dejar de funcionar en silencio.
const EXERCISE_CATEGORY_MAP = {
  bench:    'bench_press',
  squat:    'barbell_squat',
  deadlift: 'deadlift',
}

function toDateStr(date) {
  return new Date(date).toISOString().slice(0, 10)
}

function longestStreak(dateStrings) {
  const days = [...new Set(dateStrings)].sort()
  let best = 0, run = 0, prev = null
  for (const d of days) {
    if (prev !== null) {
      const diff = (new Date(d) - new Date(prev)) / 86400000
      run = diff === 1 ? run + 1 : 1
    } else {
      run = 1
    }
    if (run > best) best = run
    prev = d
  }
  return best
}

export function valueForCategory(category, stats) {
  switch (category) {
    case 'streak':   return stats.maxStreak
    case 'workouts': return stats.totalWorkouts
    case 'volume':   return stats.totalVolume
    case 'strength': return stats.maxSetWeight
    case 'bench':    return stats.exerciseMaxWeights?.bench    ?? 0
    case 'squat':    return stats.exerciseMaxWeights?.squat    ?? 0
    case 'deadlift': return stats.exerciseMaxWeights?.deadlift ?? 0
    case 'prs':      return stats.totalPRs ?? 0
    default:         return 0
  }
}

export function useAchievements() {
  const getCatalog = useCallback(async () => {
    const { data, error } = await supabase
      .from('achievements')
      .select('id, name, description, category, icon, threshold, xp, sort_order')
      .order('sort_order')
    if (error) throw error
    return data ?? []
  }, [])

  const getUnlocked = useCallback(async () => {
    const userId = getCurrentUserId()
    const { data, error } = await supabase
      .from('user_achievements')
      .select('achievement_id, unlocked_at')
      .eq('user_id', userId)
    if (error) throw error
    return data ?? []
  }, [])

  const getStats = useCallback(async () => {
    const userId = getCurrentUserId()

    const { data: sessions } = await supabase
      .from('workout_sessions')
      .select('id, started_at')
      .eq('user_id', userId)
      .not('finished_at', 'is', null)

    const list = sessions ?? []
    const stats = {
      totalWorkouts: list.length,
      totalVolume: 0,
      maxSetWeight: 0,
      maxStreak: 0,
      currentStreak: 0,
      exerciseMaxWeights: { bench: 0, squat: 0, deadlift: 0 },
      totalPRs: 0,
    }

    if (list.length > 0) {
      stats.maxStreak = longestStreak(list.map((s) => toDateStr(s.started_at)))

      // Obtener IDs de los ejercicios con categoría específica
      const { data: slugExercises } = await supabase
        .from('exercises')
        .select('id, slug')
        .in('slug', Object.values(EXERCISE_CATEGORY_MAP))

      const exerciseIdToCat = {}
      for (const e of slugExercises ?? []) {
        const cat = Object.entries(EXERCISE_CATEGORY_MAP).find(([, slug]) => slug === e.slug)?.[0]
        if (cat) exerciseIdToCat[e.id] = cat
      }

      const { data: sets } = await supabase
        .from('workout_sets')
        .select('reps, weight_kg, set_type, session_id, exercise_id, exercises(equipment)')
        .in('session_id', list.map((s) => s.id))

      for (const s of sets ?? []) {
        if (s.set_type === 'warmup') continue
        const w = Number(s.weight_kg) || 0
        const reps = Number(s.reps) || 0
        stats.totalVolume += displayWeight(w, s.exercises?.equipment) * reps
        if (w > stats.maxSetWeight) stats.maxSetWeight = w

        const cat = exerciseIdToCat[s.exercise_id]
        if (cat && w > stats.exerciseMaxWeights[cat]) stats.exerciseMaxWeights[cat] = w
      }

      // Racha actual (hasta hoy o ayer)
      const dates = new Set(list.map((s) => toDateStr(s.started_at)))
      const today = toDateStr(new Date())
      const yesterday = toDateStr(new Date(Date.now() - 86400000))
      let cursor = dates.has(today) ? today : dates.has(yesterday) ? yesterday : null
      if (cursor) {
        const c = new Date(cursor)
        while (dates.has(toDateStr(c))) {
          stats.currentStreak++
          c.setDate(c.getDate() - 1)
        }
      }
    }

    const { count } = await supabase
      .from('personal_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    stats.totalPRs = count ?? 0

    return stats
  }, [])

  // Detecta PRs nuevos en el historial completo del usuario e inserta los que falten.
  const detectAndLogPRs = useCallback(async () => {
    const userId = getCurrentUserId()

    const { data: sessions } = await supabase
      .from('workout_sessions')
      .select('id')
      .eq('user_id', userId)
      .not('finished_at', 'is', null)

    const sessionIds = (sessions ?? []).map((s) => s.id)
    if (sessionIds.length === 0) return

    const { data: sets } = await supabase
      .from('workout_sets')
      .select('weight_kg, set_type, session_id, exercise_id')
      .in('session_id', sessionIds)
      .not('weight_kg', 'is', null)
      .gt('weight_kg', 0)

    // Máximo por ejercicio a partir de los sets
    const setMaxByExercise = {}
    for (const s of sets ?? []) {
      if (s.set_type === 'warmup' || !s.exercise_id) continue
      const w = Number(s.weight_kg)
      if (!setMaxByExercise[s.exercise_id] || w > setMaxByExercise[s.exercise_id].weight) {
        setMaxByExercise[s.exercise_id] = { weight: w, sessionId: s.session_id }
      }
    }

    const exerciseIds = Object.keys(setMaxByExercise)
    if (exerciseIds.length === 0) return

    // PRs ya registrados
    const { data: stored } = await supabase
      .from('personal_records')
      .select('exercise_id, weight_kg')
      .eq('user_id', userId)
      .in('exercise_id', exerciseIds)

    const storedMax = {}
    for (const r of stored ?? []) {
      const w = Number(r.weight_kg)
      if (!storedMax[r.exercise_id] || w > storedMax[r.exercise_id]) storedMax[r.exercise_id] = w
    }

    // Insertar PRs nuevos
    const newPRs = []
    for (const [exerciseId, data] of Object.entries(setMaxByExercise)) {
      if (data.weight > (storedMax[exerciseId] ?? 0)) {
        newPRs.push({ user_id: userId, exercise_id: exerciseId, weight_kg: data.weight, session_id: data.sessionId })
      }
    }

    if (newPRs.length > 0) {
      await supabase.from('personal_records').insert(newPRs)
    }
  }, [])

  const checkAndUnlock = useCallback(async () => {
    const userId = getCurrentUserId()

    // Detectar PRs antes de evaluar logros de la categoría 'prs'
    await detectAndLogPRs()

    const [catalog, unlocked, stats] = await Promise.all([getCatalog(), getUnlocked(), getStats()])

    const have = new Set(unlocked.map((u) => u.achievement_id))
    const newly = catalog.filter(
      (a) => !have.has(a.id) && valueForCategory(a.category, stats) >= Number(a.threshold),
    )

    if (newly.length > 0) {
      const { error } = await supabase
        .from('user_achievements')
        .insert(newly.map((a) => ({ user_id: userId, achievement_id: a.id })))
      if (error) throw error
    }
    return newly
  }, [getCatalog, getUnlocked, getStats, detectAndLogPRs])

  return { getCatalog, getUnlocked, getStats, checkAndUnlock, detectAndLogPRs }
}
