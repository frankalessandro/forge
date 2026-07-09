import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getCurrentUserId } from '../stores/authStore'
import { buildWeeks, computeStreak, computeMaxStreak, getMonday } from '../utils/streak'

// Semanas transcurridas desde la primera sesión hasta hoy (mínimo 1), para
// construir el rango completo de semanas al calcular la mejor racha histórica.
function weeksSince(firstDate) {
  const first = getMonday(new Date(firstDate)).getTime()
  const current = getMonday(new Date()).getTime()
  return Math.max(1, Math.round((current - first) / (7 * 86400000)) + 1)
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

  // Los agregados (volumen, máximos, PRs) se calculan en Postgres vía RPC:
  // antes se bajaban todas las sesiones + todos los sets del historial al
  // cliente en cada visita al perfil. Solo viajan escalares + las fechas de
  // sesión (una por sesión) para calcular la racha semanal con la misma
  // lógica de utils/streak.js que usa el dashboard.
  const getStats = useCallback(async () => {
    const { data, error } = await supabase.rpc('achievement_stats')
    if (error) throw error

    const stats = {
      totalWorkouts: data?.totalWorkouts ?? 0,
      totalVolume: Number(data?.totalVolume) || 0,
      maxSetWeight: Number(data?.maxSetWeight) || 0,
      maxStreak: 0,
      currentStreak: 0,
      exerciseMaxWeights: {
        bench: Number(data?.benchMax) || 0,
        squat: Number(data?.squatMax) || 0,
        deadlift: Number(data?.deadliftMax) || 0,
      },
      totalPRs: data?.totalPRs ?? 0,
    }

    const dates = data?.sessionDates ?? []
    if (dates.length > 0) {
      const goal = data?.trainingDaysPerWeek || 1
      const oldest = dates.reduce((a, b) => (new Date(a) <= new Date(b) ? a : b))
      const weeks = buildWeeks(dates, goal, weeksSince(oldest))
      stats.maxStreak = computeMaxStreak(weeks)
      stats.currentStreak = computeStreak(weeks)
    }

    return stats
  }, [])

  // Detecta e inserta PRs nuevos server-side (una sola llamada, sin bajar el
  // historial al browser). La lógica vive en detect_prs() en Postgres.
  const detectAndLogPRs = useCallback(async () => {
    const { error } = await supabase.rpc('detect_prs')
    if (error) throw error
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
