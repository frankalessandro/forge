import { create } from 'zustand'

// Cola de toasts global. Sobrevive a la navegación porque el Toaster se monta
// en AppLayout (por encima del Outlet). Lo usa, entre otros, el desbloqueo de
// logros al finalizar un entreno.
let nextId = 1

export const useToastStore = create((set) => ({
  toasts: [],

  addToast: ({ title, description, icon }) => {
    const id = nextId++
    set((s) => ({ toasts: [...s.toasts, { id, title, description, icon }] }))
    return id
  },

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
