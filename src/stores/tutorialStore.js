import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

/**
 * Registro de tutoriales vistos, por usuario y por módulo. La fuente de
 * verdad es `user_tutorials_seen` en Supabase; se cachea en localStorage
 * (vía persist) solo para evitar el parpadeo del tutorial mientras resuelve
 * la sesión o `syncFromServer`. Si se borra la caché del navegador, este
 * store la reconstruye desde la BD en el próximo login.
 */
export const useTutorialStore = create(
  persist(
    (set, get) => ({
      seenByUser: {},
      // userId cuyo estado ya se trajo de la BD en esta sesión del navegador,
      // para no repetir el fetch en cada render.
      syncedUserId: null,

      markSeen: (userId, moduleKey) => {
        set((s) => ({
          seenByUser: {
            ...s.seenByUser,
            [userId]: { ...s.seenByUser[userId], [moduleKey]: true },
          },
        }))
        supabase
          .from('user_tutorials_seen')
          .upsert({ user_id: userId, module_key: moduleKey }, { onConflict: 'user_id,module_key' })
          .then(({ error }) => {
            if (error) console.error('No se pudo guardar el tutorial visto:', error)
          })
      },

      syncFromServer: async (userId) => {
        if (!userId || get().syncedUserId === userId) return
        const { data, error } = await supabase
          .from('user_tutorials_seen')
          .select('module_key')
          .eq('user_id', userId)
        if (error) return
        set((s) => ({
          syncedUserId: userId,
          seenByUser: {
            ...s.seenByUser,
            [userId]: {
              ...s.seenByUser[userId],
              ...Object.fromEntries(data.map((row) => [row.module_key, true])),
            },
          },
        }))
      },
    }),
    { name: 'forge-tutorials' }
  )
)
