import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useWorkoutStore } from './workoutStore'

// Solo comprobamos si hay un token persistido para el render optimista inicial
// (evita el flash de login si el usuario ya estaba logueado). El token en sí
// nunca se expone fuera de este chequeo: supabase-js ya lo administra en su
// propio storage, y no hace falta duplicarlo en el estado global de Zustand.
function hasPersistedSession() {
  try {
    const ref = new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split('.')[0]
    const raw = localStorage.getItem(`sb-${ref}-auth-token`)
    if (!raw) return false
    const parsed = JSON.parse(raw)
    const session = parsed?.access_token ? parsed : parsed?.currentSession
    return Boolean(session?.access_token)
  } catch {
    return false
  }
}

export const useAuthStore = create((set) => ({
  // isAuthenticated arranca en `true` si había un token persistido, para el
  // render optimista; `user` se confirma recién cuando resuelve getSession().
  isAuthenticated: hasPersistedSession(),
  user: null,
  // ready = supabase confirmó la sesión real + chequeamos si necesita onboarding
  ready: false,
  needsOnboarding: false,

  init() {
    async function resolveNeedsOnboarding(session) {
      if (!session) return false
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('user_id', session.user.id)
        .maybeSingle()
      // Flag explícito: "saltar por ahora" también lo marca, así la encuesta
      // no reaparece en cada login para quien decidió no completarla.
      return !profile?.onboarding_completed
    }

    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        const needsOnboarding = await resolveNeedsOnboarding(session)
        useWorkoutStore.getState().syncOwner(session?.user?.id ?? null)
        set({ isAuthenticated: Boolean(session), user: session?.user ?? null, ready: true, needsOnboarding })
      })
      .catch(() => {
        // Token corrupto/inválido en localStorage: tratamos como deslogueado
        // en vez de dejar `ready` colgado en false para siempre (spinner infinito).
        useWorkoutStore.getState().syncOwner(null)
        set({ isAuthenticated: false, user: null, ready: true, needsOnboarding: false })
      })

    // Sincroniza la sesión y recalcula needsOnboarding cada vez que aparece una
    // sesión nueva (login normal no recarga la página, así que no pasa por getSession arriba).
    let lastUserId = null
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // GoTrueClient mantiene un lock interno mientras emite este evento (incluido
      // el INITIAL_SESSION del arranque). Cualquier llamada a Supabase hecha de
      // forma síncrona acá adentro (como la query de profiles) espera ese mismo
      // lock y nunca resuelve: deadlock documentado de supabase-js v2. Diferimos
      // con setTimeout para salir del lock antes de tocar el cliente de nuevo.
      setTimeout(async () => {
        if (!session) {
          lastUserId = null
          useWorkoutStore.getState().syncOwner(null)
          set({ isAuthenticated: false, user: null, needsOnboarding: false })
          return
        }
        if (session.user.id === lastUserId) {
          set({ isAuthenticated: true, user: session.user })
          return
        }
        lastUserId = session.user.id
        // Si había un entreno guardado de otra cuenta en este dispositivo, se
        // descarta acá antes de que needsOnboarding/RootRedirect lleven a la UI.
        useWorkoutStore.getState().syncOwner(session.user.id)
        // Resolvemos needsOnboarding antes de publicar la sesión nueva para que
        // RootRedirect no alcance a mandar al dashboard antes de saber si hace falta onboarding.
        const needsOnboarding = await resolveNeedsOnboarding(session)
        set({ isAuthenticated: true, user: session.user, needsOnboarding })
      }, 0)
    })
    return () => data.subscription.unsubscribe()
  },

  completeOnboarding() {
    set({ needsOnboarding: false })
  },

  async signIn(email, password) {
    return supabase.auth.signInWithPassword({ email, password })
  },

  async signUp(email, password) {
    return supabase.auth.signUp({ email, password })
  },

  async signInWithOAuth(provider) {
    return supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    })
  },

  async signOut(options) {
    return supabase.auth.signOut(options)
  },
}))

export function getCurrentUserId() {
  const id = useAuthStore.getState().user?.id
  if (!id) throw new Error('No authenticated user')
  return id
}
