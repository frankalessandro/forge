import { useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useRoutines() {
  const getPublicRoutines = useCallback(async () => {
    const { data, error } = await supabase
      .from('routines')
      .select('id, name, description, category, routine_exercises(count)')
      .eq('is_public', true)
      .order('category')
    if (error) throw error
    return data.map((r) => ({
      ...r,
      exerciseCount: r.routine_exercises?.[0]?.count ?? 0,
    }))
  }, [])

  const getUserRoutines = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('routines')
      .select('id, name, description, category, routine_exercises(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data.map((r) => ({
      ...r,
      exerciseCount: r.routine_exercises?.[0]?.count ?? 0,
    }))
  }, [])

  const getRoutineDetail = useCallback(async (id) => {
    const { data, error } = await supabase
      .from('routines')
      .select(`
        id, name, description, category,
        routine_exercises (
          id, sets, reps, rest_seconds, "order",
          exercise_id,
          exercises ( name, muscle_groups ( name ) )
        )
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    return {
      ...data,
      routine_exercises: (data.routine_exercises ?? []).sort((a, b) => a.order - b.order),
    }
  }, [])

  return { getPublicRoutines, getUserRoutines, getRoutineDetail }
}
