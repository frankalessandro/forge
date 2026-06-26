import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getCurrentUserId } from '../stores/authStore'

function toDateStr(date) {
  return new Date(date).toISOString().slice(0, 10)
}

// Racha máxima de días consecutivos a partir de un set de fechas (YYYY-MM-DD).
function longestStreak(dateStrings) {
  const days = [...new Set(dateStrings)].sort()
  let best = 0
  let run = 0
  let prev = null
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

// La métrica que mide cada categoría de logro.
function valueForCategory(category, stats) {
  switch (category) {
    case 'streak': return stats.maxStreak
    case 'workouts': return stats.totalWorkouts
    case 'volume': return stats.totalVolume
    case 'strength': return stats.maxSetWeight
    default: return 0
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

  // Calcula las métricas de gamificación del usuario a partir de sus sesiones.
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
    }

    if (list.length > 0) {
      stats.maxStreak = longestStreak(list.map((s) => toDateStr(s.started_at)))

      const { data: sets } = await supabase
        .from('workout_sets')
        .select('reps, weight_kg, set_type, session_id')
        .in('session_id', list.map((s) => s.id))

      for (const s of sets ?? []) {
        if (s.set_type === 'warmup') continue
        const w = Number(s.weight_kg) || 0
        const reps = Number(s.reps) || 0
        stats.totalVolume += w * reps
        if (w > stats.maxSetWeight) stats.maxSetWeight = w
      }

      // Racha actual (hasta hoy o ayer).
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

    return stats
  }, [])

  // Evalúa el catálogo contra las métricas, inserta los logros recién
  // desbloqueados y devuelve esos logros (para el toast).
  const checkAndUnlock = useCallback(async () => {
    const userId = getCurrentUserId()
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
  }, [getCatalog, getUnlocked, getStats])

  return { getCatalog, getUnlocked, getStats, checkAndUnlock, valueForCategory }
}
