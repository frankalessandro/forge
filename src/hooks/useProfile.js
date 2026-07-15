import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { compressImage } from '../utils/compressImage'
import { logError } from '../utils/logError'

export function useProfile() {
  const getProfile = useCallback(async () => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return { data: null, error: new Error('Not authenticated') }
    return supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
  }, [])

  const updateProfile = useCallback(async (data) => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return { data: null, error: new Error('Not authenticated') }
    return supabase
      .from('profiles')
      .upsert({ ...data, user_id: userId, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      .select()
      .single()
  }, [])

  const uploadAvatar = useCallback(async (file) => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return { data: null, error: new Error('Not authenticated') }

    let blob
    try {
      blob = await compressImage(file)
    } catch (err) {
      logError('useProfile.uploadAvatar.compress', err)
      return { data: null, error: err }
    }

    // Ruta fija (ya no depende de la extensión original): la salida siempre
    // es jpeg recomprimido, así avatares viejos en otro formato no quedan
    // huérfanos en el bucket cada vez que alguien cambia de foto.
    const path = `${userId}/avatar.jpg`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
    if (uploadError) return { data: null, error: uploadError }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    return updateProfile({ avatar_url: `${publicUrl}?t=${Date.now()}` })
  }, [updateProfile])

  const addBodyStat = useCallback(async (weight_kg, recorded_at) => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return { data: null, error: new Error('Not authenticated') }
    const payload = { user_id: userId, weight_kg }
    if (recorded_at) payload.recorded_at = recorded_at
    const result = await supabase.from('body_stats').insert(payload).select().single()
    if (result.error) return result

    // Mantener profiles.weight_kg como "peso actual": IMC, TMB y peso saludable
    // se calculan desde ahí. Se sincroniza con el registro más reciente (no con
    // el recién insertado, que puede ser retro-datado).
    const { data: latest } = await supabase
      .from('body_stats')
      .select('weight_kg')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (latest?.weight_kg != null) {
      await supabase
        .from('profiles')
        .update({ weight_kg: latest.weight_kg, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
    }
    return result
  }, [])

  // Cambiar username y (opcionalmente) tag. Solo premium; la regla se valida en
  // la base. Retorna { ok, username, tag } o { ok:false, error }.
  const setUsername = useCallback(async (username, tag) => {
    const { data, error } = await supabase.rpc('set_username', { p_username: username, p_tag: tag ?? null })
    if (error) throw error
    return data
  }, [])

  const getBodyStats = useCallback(async () => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) return { data: [], error: new Error('Not authenticated') }
    return supabase
      .from('body_stats')
      .select('id, weight_kg, recorded_at')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .limit(30)
  }, [])

  return { getProfile, updateProfile, uploadAvatar, setUsername, addBodyStat, getBodyStats }
}
