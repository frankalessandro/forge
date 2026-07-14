import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Sesión + series agrupadas por ejercicio, para las vistas de detalle de
// entrenamiento (historial propio y de amigos).
export function useSessionDetail(sessionId) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const { data: sess, error: sessErr } = await supabase
        .from('workout_sessions')
        .select('id, started_at, finished_at, notes')
        .eq('id', sessionId)
        .single()

      if (cancelled) return
      if (sessErr) { setError(sessErr.message); setLoading(false); return }

      const { data: sets, error: setsErr } = await supabase
        .from('workout_sets')
        .select('id, exercise_id, set_number, reps, weight_kg, set_type, completed_at, exercises(name, name_es, equipment, image_url, muscle_groups(name, name_es))')
        .eq('session_id', sessionId)
        .order('set_number')

      if (cancelled) return
      if (setsErr) { setError(setsErr.message); setLoading(false); return }

      const map = new Map()
      for (const s of sets ?? []) {
        const name = s.exercises?.name_es ?? s.exercises?.name ?? 'Ejercicio'
        if (!map.has(s.exercise_id)) {
          map.set(s.exercise_id, {
            exerciseId: s.exercise_id,
            name,
            imageUrl: s.exercises?.image_url ?? null,
            muscle: s.exercises?.muscle_groups?.name_es ?? s.exercises?.muscle_groups?.name ?? null,
            sets: [],
          })
        }
        map.get(s.exercise_id).sets.push(s)
      }

      setData({ session: sess, groupedSets: [...map.values()] })
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [sessionId])

  return { data, loading, error }
}
