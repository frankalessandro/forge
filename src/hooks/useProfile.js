import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export function useProfile() {
  async function getProfile() {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return { data: null, error: new Error('Not authenticated') }
    return supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
  }

  async function updateProfile(data) {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return { data: null, error: new Error('Not authenticated') }
    return supabase
      .from('profiles')
      .upsert({ ...data, user_id: userId, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      .select()
      .single()
  }

  async function addBodyStat(weight_kg, recorded_at) {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return { data: null, error: new Error('Not authenticated') }
    const payload = { user_id: userId, weight_kg }
    if (recorded_at) payload.recorded_at = recorded_at
    return supabase.from('body_stats').insert(payload).select().single()
  }

  async function getBodyStats() {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return { data: [], error: new Error('Not authenticated') }
    return supabase
      .from('body_stats')
      .select('id, weight_kg, recorded_at')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .limit(30)
  }

  return { getProfile, updateProfile, addBodyStat, getBodyStats }
}
