import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { calcVolume } from '../utils/weight'

const PAGE_SIZE = 10

// Página de sesiones finalizadas + estadísticas (volumen, ejercicios) por
// sesión de esa página. Una sola query extra para todas las series de la
// página (evita N+1 round-trips).
export function useHistory(page) {
  const [data, setData] = useState({ sessions: [], sessionStats: {}, hasMore: false })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load(p) {
      setLoading(true)
      setError(null)

      const from = p * PAGE_SIZE
      const to = from + PAGE_SIZE

      const { data: rows, error: err } = await supabase
        .from('workout_sessions')
        .select('id, started_at, finished_at, notes')
        .not('finished_at', 'is', null)
        .order('started_at', { ascending: false })
        .range(from, to)

      if (cancelled) return
      if (err || !rows) {
        setError(err?.message ?? 'No se pudo cargar el historial.')
        setLoading(false)
        return
      }

      const hasMore = rows.length > PAGE_SIZE
      const pageSessions = rows.slice(0, PAGE_SIZE)

      const ids = pageSessions.map((s) => s.id)
      const stats = {}
      if (ids.length > 0) {
        const { data: allSets, error: setsErr } = await supabase
          .from('workout_sets')
          .select('session_id, exercise_id, reps, weight_kg, set_type, exercises(equipment, name, name_es, image_url)')
          .in('session_id', ids)
          .order('created_at')

        if (cancelled) return
        if (setsErr) {
          setError(setsErr.message)
          setLoading(false)
          return
        }

        const bySession = new Map()
        for (const set of allSets ?? []) {
          let entry = bySession.get(set.session_id)
          if (!entry) { entry = []; bySession.set(set.session_id, entry) }
          entry.push(set)
        }
        const MAX_THUMBS = 4
        for (const [sessionId, sets] of bySession) {
          const exerciseIds = new Set(sets.map((s) => s.exercise_id))
          // Primeros N ejercicios distintos, en el orden en que se registraron,
          // para la vista previa de miniaturas de cada sesión en el historial.
          const seen = new Set()
          const thumbs = []
          for (const s of sets) {
            if (seen.has(s.exercise_id)) continue
            seen.add(s.exercise_id)
            thumbs.push({
              id: s.exercise_id,
              name: s.exercises?.name_es ?? s.exercises?.name ?? '',
              imageUrl: s.exercises?.image_url ?? null,
            })
            if (thumbs.length >= MAX_THUMBS) break
          }
          stats[sessionId] = { volume: calcVolume(sets), exerciseCount: exerciseIds.size, thumbs }
        }
      }

      setData({ sessions: pageSessions, sessionStats: stats, hasMore })
      setLoading(false)
    }

    load(page)
    return () => { cancelled = true }
  }, [page])

  return { data, loading, error }
}
