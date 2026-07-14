import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { buildWeeks, computeStreak, getMonday } from '../utils/streak'
import { calcVolume } from '../utils/weight'
import { logError } from '../utils/logError'

// Estadísticas de la semana en curso (entrenos, volumen, racha) + nombre del
// usuario, para el dashboard. Las lecturas independientes van en paralelo.
export function useDashboardStats() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const now = new Date()
      const monday = getMonday(now)

      // Racha semanal: cuenta semanas consecutivas que cumplen el objetivo
      // de días/semana del usuario (no días consecutivos de calendario).
      const since = getMonday(now)
      since.setDate(since.getDate() - 11 * 7)

      const [
        { data: profile, error: profileErr },
        { data: weekSessions, error: weekErr },
        { data: recentSessions, error: recentErr },
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('name, training_days_per_week')
          .maybeSingle(),
        supabase
          .from('workout_sessions')
          .select('id, started_at')
          .not('finished_at', 'is', null)
          .gte('started_at', monday.toISOString()),
        supabase
          .from('workout_sessions')
          .select('started_at')
          .not('finished_at', 'is', null)
          .gte('started_at', since.toISOString()),
      ])

      if (cancelled) return

      const firstError = profileErr || weekErr || recentErr
      if (firstError) {
        logError('useDashboardStats.load', firstError)
        setError(firstError.message)
        setLoading(false)
        return
      }

      const goal = profile?.training_days_per_week || 1

      let weekVolume = 0
      if (weekSessions && weekSessions.length > 0) {
        const ids = weekSessions.map((s) => s.id)
        const { data: weekSets, error: setsErr } = await supabase
          .from('workout_sets')
          .select('reps, weight_kg, set_type, exercises(equipment)')
          .in('session_id', ids)

        if (cancelled) return
        if (setsErr) {
          logError('useDashboardStats.loadSets', setsErr)
          setError(setsErr.message)
          setLoading(false)
          return
        }
        weekVolume = calcVolume(weekSets ?? [])
      }

      const weeks = buildWeeks((recentSessions ?? []).map((s) => s.started_at), goal, 12)
      const streak = computeStreak(weeks)

      setData({
        name: profile?.name ?? '',
        workouts: weekSessions?.length ?? 0,
        volume: weekVolume,
        streak,
      })
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { data, loading, error }
}
