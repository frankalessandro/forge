import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { buildWeeks, computeStreak, getMonday, toDateStr } from '../utils/streak'

// Racha semanal, objetivo, semanas construidas (12 últimas) y set de días
// entrenados, para la vista de detalle de racha.
export function useStreakData() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('training_days_per_week, goal')
        .maybeSingle()

      if (cancelled) return
      if (profileErr) {
        setError(profileErr.message)
        setLoading(false)
        return
      }

      const targetDays = profile?.training_days_per_week || 1
      const goal = profile?.goal ?? null

      // Traemos sesiones finalizadas de las últimas 12 semanas.
      const since = getMonday(new Date())
      since.setDate(since.getDate() - 11 * 7)

      const { data: sessions, error: sessErr } = await supabase
        .from('workout_sessions')
        .select('started_at')
        .not('finished_at', 'is', null)
        .gte('started_at', since.toISOString())

      if (cancelled) return
      if (sessErr) {
        setError(sessErr.message)
        setLoading(false)
        return
      }

      const dates = (sessions ?? []).map((s) => s.started_at)
      const builtWeeks = buildWeeks(dates, targetDays, 12)

      setData({
        target: targetDays,
        goal,
        weeks: builtWeeks,
        streak: computeStreak(builtWeeks),
        trainedSet: new Set(dates.map(toDateStr)),
      })
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { data, loading, error }
}
