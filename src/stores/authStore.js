import { create } from 'zustand'
import { supabase } from '../lib/supabase'

function readPersistedSession() {
  try {
    const ref = new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split('.')[0]
    const raw = localStorage.getItem(`sb-${ref}-auth-token`)
    if (!raw) return null
    const parsed = JSON.parse(raw)
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
        set({ session, user: session?.user ?? null, ready: true, needsOnboarding })
      })
      .catch(() => {
        // Token corrupto/inválido en localStorage: tratamos como deslogueado
        // en vez de dejar `ready` colgado en false para siempre (spinner infinito).
        set({ session: null, user: null, ready: true, needsOnboarding: false })
      })

    // Sincroniza la sesión y recalcula needsOnboarding cada vez que aparece una
    // sesión nueva (login normal no recarga la página, así que no pasa por getSession arriba).
    let lastUserId = null
    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        lastUserId = null
        set({ session, user: null, needsOnboarding: false })
        return
      }
      if (session.user.id === lastUserId) {
        set({ session, user: session.user })
        return
      }
      lastUserId = session.user.id
      // Resolvemos needsOnboarding antes de publicar la sesión nueva para que
      // RootRedirect no alcance a mandar al dashboard antes de saber si hace falta onboarding.
      const needsOnboarding = await resolveNeedsOnboarding(session)
      set({ session, user: session.user, needsOnboarding })
    })
    return () => data.subscription.unsubscribe()
  },

  completeOnboarding() {
    set({ needsOnboarding: false })
  },
}))

export function getCurrentUserId() {
  const id = useAuthStore.getState().user?.id
  if (!id) throw new Error('No authenticated user')
  return id
}
