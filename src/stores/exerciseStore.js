import { create } from 'zustand'

export const useExerciseStore = create((set) => ({
  muscleGroupId: null,
  equipment: null,
  search: '',

  setMuscleGroup: (id) => set({ muscleGroupId: id }),
  setEquipment: (eq) => set({ equipment: eq }),
  setSearch: (s) => set({ search: s }),
  resetFilters: () => set({ muscleGroupId: null, equipment: null, search: '' }),
}))
