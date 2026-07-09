import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getCurrentUserId } from '../stores/authStore'
import { planSplit } from '../utils/routineTemplates'

export function useRoutines() {
  const getPublicRoutines = useCallback(async () => {
    const { data, error } = await supabase
      .from('routines')
      .select('id, name, description, category, category_color, focus, routine_exercises(count)')
      .eq('is_public', true)
      .order('category')
    if (error) throw error
    return data.map((r) => ({
      ...r,
      exerciseCount: r.routine_exercises?.[0]?.count ?? 0,
    }))
  }, [])

  const getUserRoutines = useCallback(async () => {
    const userId = getCurrentUserId()
    const { data, error } = await supabase
      .from('routines')
      .select('id, name, description, category, category_color, focus, routine_exercises(count)')
      .eq('user_id', userId)
      .eq('is_generated', false)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data.map((r) => ({
      ...r,
      exerciseCount: r.routine_exercises?.[0]?.count ?? 0,
    }))
  }, [])

  const getGeneratedRoutines = useCallback(async () => {
    const userId = getCurrentUserId()
    const { data, error } = await supabase
      .from('routines')
      .select('id, name, description, category, category_color, focus, routine_exercises(count)')
      .eq('user_id', userId)
      .eq('is_generated', true)
      .order('created_at', { ascending: true })
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
        id, name, description, category, category_color, focus, user_id, is_public, is_generated,
        routine_exercises (
          id, sets, reps, rest_seconds, "order",
          exercise_id,
          exercises ( name, name_es, image_url, muscle_groups ( name, name_es ) )
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

  const createRoutine = useCallback(async ({ name, description, category, category_color, focus }) => {
    const userId = getCurrentUserId()
    const { data, error } = await supabase
      .from('routines')
      .insert({
        user_id: userId,
        name,
        description: description || null,
        category: category || null,
        category_color: category ? category_color || null : null,
        focus: focus || null,
        is_public: false,
      })
      .select('id')
      .single()
    if (error) throw error
    return data.id
  }, [])

  const updateRoutine = useCallback(async (id, { name, description, category, category_color, focus }) => {
    const { error } = await supabase
      .from('routines')
      .update({
        name,
        description: description || null,
        category: category || null,
        category_color: category ? category_color || null : null,
        focus: focus || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    if (error) throw error
  }, [])

  const deleteRoutine = useCallback(async (id) => {
    const { error } = await supabase.from('routines').delete().eq('id', id)
    if (error) throw error
  }, [])

  // Reemplaza por completo los ejercicios de una rutina.
  // items: [{ exercise_id, sets, reps, rest_seconds }] — el orden viene del índice.
  // Va por RPC: borrar + insertar comparten transacción en Postgres, así un
  // fallo a mitad de camino no deja la rutina vacía.
  const replaceRoutineExercises = useCallback(async (routineId, items) => {
    const { error } = await supabase.rpc('replace_routine_exercises', {
      p_routine_id: routineId,
      p_items: items.map((it) => ({
        exercise_id: it.exercise_id,
        sets: it.sets ?? 3,
        reps: it.reps ?? 10,
        rest_seconds: it.rest_seconds ?? 90,
      })),
    })
    if (error) throw error
  }, [])

  // Copia una rutina (típicamente predeterminada) a una rutina propia nueva,
  // metadata + routine_exercises, sin vínculo al origen. Devuelve el id nuevo.
  const copyRoutine = useCallback(async (sourceRoutineId) => {
    const { data, error } = await supabase.rpc('copy_routine_to_user', {
      p_source_routine_id: sourceRoutineId,
    })
    if (error) throw error
    return data
  }, [])

  // Agrega un ejercicio suelto a una rutina propia con valores default
  // (3 series, 10 reps, 90s descanso), sin pasar por el editor completo.
  const addExerciseToRoutine = useCallback(async (routineId, exerciseId) => {
    const { error } = await supabase.rpc('add_exercise_to_routine', {
      p_routine_id: routineId,
      p_exercise_id: exerciseId,
    })
    if (error) throw error
  }, [])

  // Genera un split de rutinas según el objetivo, nivel y días/semana del usuario.
  // Trae el catálogo, arma el plan (lógica pura en routineTemplates) y lo
  // persiste con UNA llamada RPC atómica: create_generated_routines borra las
  // generadas anteriores e inserta el split completo en la misma transacción.
  // Antes eran ~2 round-trips en serie por cada rutina del split, y un fallo
  // a mitad de camino dejaba la generación incompleta.
  const generateForGoal = useCallback(async ({ goal, level, daysPerWeek }) => {
    const { data: exercises, error: exError } = await supabase
      .from('exercises')
      .select('id, name, equipment, primary_muscles, muscle_groups(name)')
    if (exError) throw exError

    const plan = planSplit({ goal, level, daysPerWeek, exercises: exercises ?? [] })
    if (plan.length === 0) {
      throw new Error('No hay ejercicios suficientes para generar la rutina.')
    }

    const { data: created, error } = await supabase.rpc('create_generated_routines', {
      p_routines: plan.map((routine) => ({
        name: routine.name,
        description: routine.description ?? null,
        category: routine.category ?? null,
        focus: routine.focus ?? null,
        exercises: routine.exercises.map((it) => ({
          exercise_id: it.exercise_id,
          sets: it.sets,
          reps: it.reps,
          rest_seconds: it.rest_seconds,
        })),
      })),
    })
    if (error) throw error
    return created ?? []
  }, [])

  return {
    getPublicRoutines,
    getUserRoutines,
    getGeneratedRoutines,
    getRoutineDetail,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    replaceRoutineExercises,
    copyRoutine,
    addExerciseToRoutine,
    generateForGoal,
  }
}
