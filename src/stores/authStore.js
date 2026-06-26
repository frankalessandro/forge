import { create } from 'zustand'
import { supabase } from '../lib/supabase'

// Lee la sesión persistida por supabase-js directo de localStorage, de forma
// síncrona y sin tocar la red. Sirve para renderizar optimista en el primer
// frame: si el usuario ya tenía sesión, no ve ningún flash de login mientras
// el refresh real ocurre en segundo plano.
function readPersistedSession() {
  try {
    const ref = new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split('.')[0]
    const raw = localStorage.getItem(`sb-${ref}-auth-token`)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // v2 guarda la sesión directa; versiones viejas la envolvían en currentSession.
    const session = parsed?.access_token ? parsed : parsed?.currentSession
    return session?.access_token ? session : null
  } catch {
    return null
  }
}

const seed = readPersistedSession()

export const useAuthStore = create((set) => ({
  session: seed,
  user: seed?.user ?? null,
  // ready = ya confirmamos la sesión real con supabase (getSession resuelto).
  // Hasta entonces, session puede ser el seed optimista de localStorage.
  ready: false,

  init() {
    // Confirma la sesión real (puede disparar un refresh de token en segundo
    // plano, pero ya no bloquea el render porque mostramos el seed optimista).
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user ?? null, ready: true })
    })

    // Mantiene el store sincronizado ante login / logout / refresh de token.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, ready: true })
    })
    return () => data.subscription.unsubscribe()
  },
}))

// Id del usuario actual, sin llamada de red (lee del store). Lanza si no hay
// sesión: los hooks corren detrás del guard de auth, así que siempre debería
// haberla. Reemplaza a supabase.auth.getUser(), que pegaba a la red en cada query.
export function getCurrentUserId() {
  const id = useAuthStore.getState().user?.id
  if (!id) throw new Error('No authenticated user')
  return id
}
