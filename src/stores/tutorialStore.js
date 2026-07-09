import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Registro de tutoriales vistos, por usuario y por módulo. Persistido en
 * localStorage: es preferencia de UI local, no dato del usuario (no va a
 * Supabase). Se namespacea por user_id para que una cuenta nueva en el
 * mismo navegador vea los tutoriales desde cero.
 */
export const useTutorialStore = create(
  persist(
    (set) => ({
      seenByUser: {},
      markSeen: (userId, moduleKey) =>
        set((s) => ({
          seenByUser: {
            ...s.seenByUser,
            [userId]: { ...s.seenByUser[userId], [moduleKey]: true },
          },
        })),
    }),
    { name: 'forge-tutorials' }
  )
)
