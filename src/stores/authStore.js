import { create } from 'zustand'
import { supabase } from '../lib/supabase'

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
        .select('name')
        .eq('user_id', session.user.id)
        .maybeSingle()
      return !profile?.name
    }

    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        const needsOnboarding = await resolveNeedsOnboarding(session)
        set({ isAuthenticated: Boolean(session), user: session?.user ?? null, ready: true, needsOnboarding })
      })
      .catch(() => {
        // Token corrupto/inválido en localStorage: tratamos como deslogueado
        // en vez de dejar `ready` colgado en false para siempre (spinner infinito).
        set({ isAuthenticated: false, user: null, ready: true, needsOnboarding: false })
      })

    // Sincroniza la sesión y recalcula needsOnboarding cada vez que aparece una
    // sesión nueva (login normal no recarga la página, así que no pasa por getSession arriba).
    let lastUserId = null
    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        lastUserId = null
        set({ isAuthenticated: false, user: null, needsOnboarding: false })
        return
      }
      if (session.user.id === lastUserId) {
        set({ isAuthenticated: true, user: session.user })
        return
      }
      lastUserId = session.user.id
      // Resolvemos needsOnboarding antes de publicar la sesión nueva para que
      // RootRedirect no alcance a mandar al dashboard antes de saber si hace falta onboarding.
      const needsOnboarding = await resolveNeedsOnboarding(session)
      set({ isAuthenticated: true, user: session.user, needsOnboarding })
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
