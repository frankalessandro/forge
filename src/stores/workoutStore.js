import { create } from 'zustand'

export const useWorkoutStore = create((set) => ({
  session: null,       // { id, startedAt, notes }
  exercises: [],       // [{ exerciseId, name, sets: [{ id, reps, weight_kg, set_type, completed, dbId }] }]
  isActive: false,

  startSession: (session) =>
    set({ session, exercises: [], isActive: true }),

  addExercise: (exercise) =>
    set((s) => ({
      exercises: [
        ...s.exercises,
        { exerciseId: exercise.id, name: exercise.name, sets: [] },
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
}))
