import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getCurrentUserId } from '../stores/authStore'
import { useWorkoutStore } from '../stores/workoutStore'

export function useWorkout() {
  // Las acciones del store son estables por referencia (Zustand las crea una
  // sola vez). No nos suscribimos al estado con useWorkoutStore() — eso haría
  // que cada cambio (cada tecla en un peso/reps) recree estos callbacks y rompa
  // el memo de ExerciseCard/SetRow. Leemos siempre vía getState().

  const startSession = useCallback(async () => {
    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({ user_id: getCurrentUserId() })
      .select('id, started_at')
      .single()

    if (error) throw error

    useWorkoutStore.getState().startSession({ id: data.id, startedAt: data.started_at, notes: '' })
    return data
  }, [])

  const startSessionFromRoutine = useCallback(async (routineId) => {
    const userId = getCurrentUserId()

    // 1. Traer los ejercicios de la rutina, ordenados
    const { data: routine, error: routineError } = await supabase
      .from('routines')
      .select(`
        id,
        routine_exercises (
          sets, reps, "order",
          exercise_id,
          exercises ( name, image_url, equipment )
        )
      `)
      .eq('id', routineId)
      .single()
    if (routineError) throw routineError

    const planned = (routine.routine_exercises ?? []).sort((a, b) => a.order - b.order)

    // 2. Crear la sesión vinculada a la rutina
    const { data: session, error: sessionError } = await supabase
      .from('workout_sessions')
      .insert({ user_id: userId, routine_id: routineId })
      .select('id, started_at')
      .single()
    if (sessionError) throw sessionError

    const store = useWorkoutStore.getState()
    store.startSession({ id: session.id, startedAt: session.started_at, notes: '' })

    // 3. Pre-cargar series planificadas (reps de la rutina, peso a completar)
    const rows = []
    for (const re of planned) {
      const count = re.sets ?? 1
      for (let i = 0; i < count; i++) {
        rows.push({
          session_id: session.id,
          exercise_id: re.exercise_id,
          set_number: i + 1,
          reps: re.reps ?? null,
          weight_kg: null,
          set_type: 'normal',
        })
      }
    }

    if (rows.length > 0) {
      const { data: inserted, error: setsError } = await supabase
        .from('workout_sets')
        .insert(rows)
        .select('id, exercise_id, set_number')
      if (setsError) throw setsError

      // 4. Poblar el store respetando el orden de la rutina
      for (const re of planned) {
        store.addExercise({
          id: re.exercise_id,
          name: re.exercises?.name ?? 'Ejercicio',
          image_url: re.exercises?.image_url ?? null,
          equipment: re.exercises?.equipment ?? null,
        })
        const exSets = inserted
          .filter((s) => s.exercise_id === re.exercise_id)
          .sort((a, b) => a.set_number - b.set_number)
        for (const s of exSets) {
          store.addSet(re.exercise_id, {
            dbId: s.id,
            reps: re.reps ?? null,
            weight_kg: null,
            set_type: 'normal',
          })
        }
      }
    }

    return session
  }, [])

  const addSet = useCallback(async (exerciseId, setData) => {
    const session = useWorkoutStore.getState().session
    const exercise = useWorkoutStore.getState().exercises.find(
      (ex) => ex.exerciseId === exerciseId
    )
    const setNumber = (exercise?.sets.length ?? 0) + 1

    const { data, error } = await supabase
      .from('workout_sets')
      .insert({
        session_id: session.id,
        exercise_id: exerciseId,
        set_number: setNumber,
        reps: setData.reps ?? null,
        weight_kg: setData.weight_kg ?? null,
        set_type: setData.set_type ?? 'normal',
      })
      .select('id')
      .single()

    if (error) throw error

    useWorkoutStore.getState().addSet(exerciseId, { ...setData, dbId: data.id, set_type: setData.set_type ?? 'normal' })
    return data
  }, [])

  const updateSet = useCallback(async (exerciseId, setIndex, patch) => {
    const exercise = useWorkoutStore.getState().exercises.find(
      (ex) => ex.exerciseId === exerciseId
    )
    const dbId = exercise?.sets[setIndex]?.dbId
    if (!dbId) return

    const { error } = await supabase
      .from('workout_sets')
      .update(patch)
      .eq('id', dbId)

    if (error) throw error
    useWorkoutStore.getState().updateSet(exerciseId, setIndex, patch)
  }, [])

  const completeSet = useCallback(async (exerciseId, setIndex) => {
    const set = useWorkoutStore
      .getState()
      .exercises.find((ex) => ex.exerciseId === exerciseId)?.sets[setIndex]
    if (!set?.dbId) return

    const nowCompleted = !set.completed
    // Actualizamos el store primero: el check se ve al instante (sin esperar la red).
    useWorkoutStore.getState().completeSet(exerciseId, setIndex)

    const { error } = await supabase
      .from('workout_sets')
      .update({ completed_at: nowCompleted ? new Date().toISOString() : null })
      .eq('id', set.dbId)

    if (error) {
      useWorkoutStore.getState().completeSet(exerciseId, setIndex) // revertir si falló
      throw error
    }
  }, [])

  // Persiste (en background) todas las series de un ejercicio según el estado
  // actual del store. Lo usa el logger con debounce para no escribir por tecla.
  const syncExerciseSets = useCallback(async (exerciseId) => {
    const ex = useWorkoutStore
      .getState()
      .exercises.find((e) => e.exerciseId === exerciseId)
    if (!ex) return
    await Promise.all(
      ex.sets
        .filter((s) => s.dbId)
        .map((s) =>
          supabase
            .from('workout_sets')
            .update({
              weight_kg: s.weight_kg ?? null,
              reps: s.reps ?? null,
              set_type: s.set_type ?? 'normal',
            })
            .eq('id', s.dbId)
        )
    )
  }, [])

  const deleteSet = useCallback(async (exerciseId, setIndex) => {
    const exercise = useWorkoutStore.getState().exercises.find(
      (ex) => ex.exerciseId === exerciseId
    )
    const dbId = exercise?.sets[setIndex]?.dbId
    if (dbId) {
      const { error } = await supabase.from('workout_sets').delete().eq('id', dbId)
      if (error) throw error
    }
    useWorkoutStore.getState().deleteSet(exerciseId, setIndex)
  }, [])

  const deleteExercise = useCallback(async (exerciseId) => {
    const session = useWorkoutStore.getState().session
    const { error } = await supabase
      .from('workout_sets')
      .delete()
      .eq('session_id', session.id)
      .eq('exercise_id', exerciseId)
    if (error) throw error
    useWorkoutStore.getState().deleteExercise(exerciseId)
  }, [])

  const finishSession = useCallback(async (notes) => {
    const session = useWorkoutStore.getState().session
    const { error } = await supabase
      .from('workout_sessions')
      .update({ finished_at: new Date().toISOString(), notes: notes ?? null })
      .eq('id', session.id)
    if (error) throw error
    const sessionId = session.id
    useWorkoutStore.getState().finishSession()
    return sessionId
  }, [])

  const cancelSession = useCallback(async () => {
    const session = useWorkoutStore.getState().session
    if (session?.id) {
      // Cascade delete via FK will remove workout_sets too
      await supabase.from('workout_sessions').delete().eq('id', session.id)
    }
    useWorkoutStore.getState().cancelSession()
  }, [])

  const getLastPerformance = useCallback(async (exerciseId) => {
    const userId = getCurrentUserId()
    const currentSessionId = useWorkoutStore.getState().session?.id

    // Última vez que se hizo este ejercicio. Antes era un N+1 en serie (1 query
    // de sesiones + 1 query por cada sesión hasta encontrar sets). Ahora son 2
    // queries acotadas, independientes del número de ejercicios del entreno:
    //   1) las sesiones finalizadas recientes (orden desc)
    //   2) todos los sets de este ejercicio en esas sesiones, de una sola vez
    const { data: sessions } = await supabase
      .from('workout_sessions')
      .select('id')
      .eq('user_id', userId)
      .not('finished_at', 'is', null)
      .neq('id', currentSessionId ?? '')
      .order('finished_at', { ascending: false })
      .limit(10)

    if (!sessions?.length) return null

    const ids = sessions.map((s) => s.id)
    const { data: rows } = await supabase
      .from('workout_sets')
      .select('reps, weight_kg, set_type, set_number, session_id')
      .eq('exercise_id', exerciseId)
      .in('session_id', ids)
      .order('set_number')

    if (!rows?.length) return null

    // Elegimos la sesión más reciente (según el orden de `sessions`) que tenga
    // sets de este ejercicio, y devolvemos sus sets ya ordenados por set_number.
    const bySession = new Set(rows.map((r) => r.session_id))
    const latestId = ids.find((id) => bySession.has(id))
    return rows
      .filter((r) => r.session_id === latestId)
      .map(({ reps, weight_kg, set_type, set_number }) => ({ reps, weight_kg, set_type, set_number }))
  }, [])

  return {
    startSession,
    startSessionFromRoutine,
    addSet,
    updateSet,
    syncExerciseSets,
    completeSet,
    deleteSet,
    deleteExercise,
    finishSession,
    cancelSession,
    getLastPerformance,
  }
}
