import { supabase } from '../lib/supabase'

export function useProfile() {
  async function getProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('Not authenticated') }
    return supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
  }

  async function updateProfile(data) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('Not authenticated') }
    return supabase
      .from('profiles')
      .upsert({ ...data, user_id: user.id, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      .select()
      .single()
  }

  async function addBodyStat(weight_kg, recorded_at) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('Not authenticated') }
    const payload = { user_id: user.id, weight_kg }
    if (recorded_at) payload.recorded_at = recorded_at
    return supabase.from('body_stats').insert(payload).select().single()
  }

  async function getBodyStats() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: [], error: new Error('Not authenticated') }
    return supabase
      .from('body_stats')
      .select('id, weight_kg, recorded_at')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false })
      .limit(30)
  }

  return { getProfile, updateProfile, addBodyStat, getBodyStats }
}
