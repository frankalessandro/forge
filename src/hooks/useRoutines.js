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
        id, name, description, category, user_id, is_public,
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

  const createRoutine = useCallback(async ({ name, description, category }) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('routines')
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        category: category || null,
        is_public: false,
      })
      .select('id')
      .single()
    if (error) throw error
    return data.id
  }, [])

  const updateRoutine = useCallback(async (id, { name, description, category }) => {
    const { error } = await supabase
      .from('routines')
      .update({
        name,
        description: description || null,
        category: category || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (error) throw error
  }, [])

  const deleteRoutine = useCallback(async (id) => {
    const { error } = await supabase.from('routines').delete().eq('id', id)
    if (error) throw error
  }, [])

  // Reemplaza por completo los ejercicios de una rutina (borrar + insertar).
  // items: [{ exercise_id, sets, reps, rest_seconds }] — el orden viene del índice.
  const replaceRoutineExercises = useCallback(async (routineId, items) => {
    const { error: delError } = await supabase
      .from('routine_exercises')
      .delete()
      .eq('routine_id', routineId)
    if (delError) throw delError

    if (items.length === 0) return

    const rows = items.map((it, idx) => ({
      routine_id: routineId,
      exercise_id: it.exercise_id,
      sets: it.sets ?? 3,
      reps: it.reps ?? 10,
      rest_seconds: it.rest_seconds ?? 90,
      order: idx + 1,
    }))
    const { error: insError } = await supabase.from('routine_exercises').insert(rows)
    if (insError) throw insError
  }, [])

  return {
    getPublicRoutines,
    getUserRoutines,
    getRoutineDetail,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    replaceRoutineExercises,
  }
}
