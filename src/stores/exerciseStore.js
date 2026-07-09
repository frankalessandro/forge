import { create } from 'zustand'

export const useExerciseStore = create((set) => ({
  bodyPart: null,
  equipment: null,
  search: '',

  setBodyPart: (bp) => set({ bodyPart: bp }),
  setEquipment: (eq) => set({ equipment: eq }),
  setSearch: (s) => set({ search: s }),
  resetFilters: () => set({ bodyPart: null, equipment: null, search: '' }),
}))
