import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getCurrentUserId } from '../stores/authStore'
import { planSplit } from '../utils/routineTemplates'

// Selección base para listados de rutinas: cuenta total de ejercicios más
// una preview limitada a 4 imágenes (alias `preview`, ordenada por "order")
// para mostrar thumbnails en las tarjetas sin traer la rutina completa.
const ROUTINE_LIST_SELECT = `
  id, name, description, category, category_color, focus,
  routine_exercises(count),
  preview:routine_exercises(order, exercises(image_url))
`

function withPreview(r) {
  const { routine_exercises, preview, ...rest } = r
  return {
    ...rest,
    exerciseCount: routine_exercises?.[0]?.count ?? 0,
    previewImages: (preview ?? []).map((re) => re.exercises?.image_url).filter(Boolean),
  }
}

export function useRoutines() {
  const getPublicRoutines = useCallback(async () => {
    const { data, error } = await supabase
      .from('routines')
      .select(ROUTINE_LIST_SELECT)
      .eq('is_public', true)
      .order('order', { foreignTable: 'preview', ascending: true })
      .limit(4, { foreignTable: 'preview' })
      .order('category')
    if (error) throw error
    return data.map(withPreview)
  }, [])

  const getUserRoutines = useCallback(async () => {
    const userId = getCurrentUserId()
    const { data, error } = await supabase
      .from('routines')
      .select(ROUTINE_LIST_SELECT)
      .eq('user_id', userId)
      .eq('is_generated', false)
      .order('order', { foreignTable: 'preview', ascending: true })
      .limit(4, { foreignTable: 'preview' })
      .order('created_at', { ascending: false })
    if (error) throw error
    return data.map(withPreview)
  }, [])

  const getGeneratedRoutines = useCallback(async () => {
    const userId = getCurrentUserId()
    const { data, error } = await supabase
      .from('routines')
      .select(ROUTINE_LIST_SELECT)
      .eq('user_id', userId)
      .eq('is_generated', true)
      .order('order', { foreignTable: 'preview', ascending: true })
      .limit(4, { foreignTable: 'preview' })
      .order('created_at', { ascending: true })
    if (error) throw error
    return data.map(withPreview)
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
  //
  // Antes de generar, se traen los ejercicios de la última generación para
  // evitarlos si hay alternativas (junto con la mezcla dentro de cada pool en
  // routineTemplates), así regenerar da una rutina distinta cada vez en vez
  // de repetir siempre la misma.
  const generateForGoal = useCallback(async ({ goal, level, daysPerWeek }) => {
    const userId = getCurrentUserId()
    const [{ data: exercises, error: exError }, { data: prevRoutines, error: prevError }] =
      await Promise.all([
        supabase.from('exercises').select('id, name, equipment, primary_muscles, muscle_groups(name)'),
        supabase
          .from('routines')
          .select('routine_exercises(exercise_id)')
          .eq('user_id', userId)
          .eq('is_generated', true),
      ])
    if (exError) throw exError
    if (prevError) throw prevError

    const excludeIds = new Set(
      (prevRoutines ?? []).flatMap((r) => r.routine_exercises?.map((re) => re.exercise_id) ?? []),
    )

    const plan = planSplit({ goal, level, daysPerWeek, exercises: exercises ?? [], excludeIds })
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
