import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Persistido en localStorage: si hay un refresh, un reset inesperado o se
// pierde la conexión a mitad de un entreno, el estado en curso (sesión,
// ejercicios, series) sigue disponible al volver. Los sets ya confirmados
// también viven en Supabase (useWorkout los sincroniza), pero lo no
// guardado aún (inputs sin debounce, orden, colapsos) solo vive acá.
export const useWorkoutStore = create(persist((set) => ({
  session: null,       // { id, startedAt, notes }
  exercises: [],       // [{ exerciseId, name, equipment, sets: [{ id, reps, weight_kg, set_type, completed, dbId }] }]
  isActive: false,
  // La rehidratación desde localStorage es asíncrona: hasta que esto sea
  // `true`, `isActive` puede estar en su valor inicial (false) aunque en
  // realidad haya un entreno guardado. Sin esto, un refresh en /workout/active
  // dispara el redirect a /workout/start antes de que se restaure el estado.
  hasHydrated: false,
  setHasHydrated: (v) => set({ hasHydrated: v }),

  startSession: (session) =>
    set({ session, exercises: [], isActive: true }),

  addExercise: (exercise) =>
    set((s) => ({
      exercises: [
        ...s.exercises,
        {
          exerciseId: exercise.id,
          name: exercise.name,
          imageUrl: exercise.image_url ?? null,
          equipment: exercise.equipment ?? null,
          sets: [],
        },
      ],
    })),

  addSet: (exerciseId, setData) =>
    set((s) => ({
      exercises: s.exercises.map((ex) =>
        ex.exerciseId === exerciseId
          ? { ...ex, sets: [...ex.sets, { ...setData, completed: false }] }
          : ex
      ),
    })),

  updateSet: (exerciseId, setIndex, patch) =>
    set((s) => ({
      exercises: s.exercises.map((ex) =>
        ex.exerciseId === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((st, i) => (i === setIndex ? { ...st, ...patch } : st)),
            }
          : ex
      ),
    })),

  completeSet: (exerciseId, setIndex) =>
    set((s) => ({
      exercises: s.exercises.map((ex) =>
        ex.exerciseId === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((st, i) =>
                i === setIndex ? { ...st, completed: !st.completed } : st
              ),
            }
          : ex
      ),
    })),

  deleteSet: (exerciseId, setIndex) =>
    set((s) => ({
      exercises: s.exercises.map((ex) =>
        ex.exerciseId === exerciseId
          ? { ...ex, sets: ex.sets.filter((_, i) => i !== setIndex) }
          : ex
      ),
    })),

  deleteExercise: (exerciseId) =>
    set((s) => ({
      exercises: s.exercises.filter((ex) => ex.exerciseId !== exerciseId),
    })),

  reorderExercises: (from, to) =>
    set((s) => {
      const list = [...s.exercises]
      const [moved] = list.splice(from, 1)
      list.splice(to, 0, moved)
      return { exercises: list }
    }),

  setNotes: (notes) =>
    set((s) => ({ session: { ...s.session, notes } })),

  finishSession: () =>
    set({ session: null, exercises: [], isActive: false }),

  cancelSession: () =>
    set({ session: null, exercises: [], isActive: false }),
}), {
  name: 'forge-workout-session',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({ session: state.session, exercises: state.exercises, isActive: state.isActive }),
  onRehydrateStorage: () => (state) => {
    state?.setHasHydrated(true)
  },
}))
