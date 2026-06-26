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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      let needsOnboarding = false
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('user_id', session.user.id)
          .maybeSingle()
        needsOnboarding = !profile?.name
      }
      set({ session, user: session?.user ?? null, ready: true, needsOnboarding })
    })

    // Mantiene sesión sincronizada sin pisar needsOnboarding (lo setea getSession)
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      set((state) => ({
        session,
        user: session?.user ?? null,
        needsOnboarding: session ? state.needsOnboarding : false,
      }))
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
