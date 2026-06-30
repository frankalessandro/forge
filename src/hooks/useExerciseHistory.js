import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { displayWeight } from '../utils/weight'

// 1RM estimado con la fórmula de Epley: peso · (1 + reps/30).
// Con 1 repetición, el 1RM es el propio peso levantado.
function epley1RM(weight, reps) {
  if (!weight || !reps) return 0
  if (reps <= 1) return weight
  return weight * (1 + reps / 30)
}

// Agrupa las series por sesión y calcula, por fecha:
// peso máximo, volumen total (peso·reps) y 1RM estimado máximo.
// También extrae los récords personales (PRs) del historial completo.
function aggregate(rows, equipment) {
  const bySession = new Map()

  for (const r of rows) {
    if (r.set_type === 'warmup') continue
    const weight = Number(r.weight_kg) || 0
    const reps = Number(r.reps) || 0
    if (weight <= 0 && reps <= 0) continue

    const session = r.session
    if (!session) continue
    const sid = session.id

    if (!bySession.has(sid)) {
      bySession.set(sid, { date: session.started_at, maxWeight: 0, volume: 0, est1RM: 0, maxReps: 0 })
    }
    const agg = bySession.get(sid)
    agg.volume += displayWeight(weight, equipment) * reps
    if (weight > agg.maxWeight) agg.maxWeight = weight
    if (reps > agg.maxReps) agg.maxReps = reps
    const e = epley1RM(weight, reps)
    if (e > agg.est1RM) agg.est1RM = e
  }

  const history = [...bySession.values()]
    .map((a) => ({
      date: a.date,
      maxWeight: Math.round(a.maxWeight * 10) / 10,
      volume: Math.round(a.volume),
      est1RM: Math.round(a.est1RM),
      maxReps: a.maxReps,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  let prs = null
  if (history.length) {
    prs = {
      maxWeight: Math.max(...history.map((h) => h.maxWeight)),
      maxVolume: Math.max(...history.map((h) => h.volume)),
      max1RM: Math.max(...history.map((h) => h.est1RM)),
      maxReps: Math.max(...history.map((h) => h.maxReps)),
      sessions: history.length,
    }
  }

  return { history, prs }
}

// Historial de progreso de un ejercicio para el usuario actual.
// Devuelve un punto por sesión finalizada con peso máx / volumen / 1RM estimado,
// más los récords personales destacados.
export function useExerciseHistory(exerciseId) {
  const [history, setHistory] = useState([])
  const [prs, setPrs] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!exerciseId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const userId = useAuthStore.getState().user?.id
      const [{ data, error: err }, { data: exercise }] = await Promise.all([
        supabase
          .from('workout_sets')
          .select('reps, weight_kg, set_type, session:workout_sessions!inner(id, started_at, finished_at, user_id)')
          .eq('exercise_id', exerciseId)
          .eq('session.user_id', userId)
          .not('session.finished_at', 'is', null),
        supabase.from('exercises').select('equipment').eq('id', exerciseId).maybeSingle(),
      ])

      if (cancelled) return
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }

      const { history: h, prs: p } = aggregate(data ?? [], exercise?.equipment)
      setHistory(h)
      setPrs(p)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [exerciseId])

  return { history, prs, loading, error }
}
