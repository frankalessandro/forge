import { useCallback } from 'react'
import { supabase } from '../lib/supabase'

// Capa social. Las lecturas pasan por funciones SECURITY DEFINER (solo exponen
// campos públicos y validan amistad); las mutaciones van contra friendships con
// sus policies de RLS.
export function useFriends() {
  const searchUsers = useCallback(async (query) => {
    const q = query.trim()
    if (!q) return []
    const { data, error } = await supabase.rpc('search_users', { q })
    if (error) throw error
    return data ?? []
  }, [])

  const listFriends = useCallback(async () => {
    const { data, error } = await supabase.rpc('list_friends')
    if (error) throw error
    return data ?? []
  }, [])

  const listRequests = useCallback(async () => {
    const { data, error } = await supabase.rpc('list_friend_requests')
    if (error) throw error
    return data ?? []
  }, [])

  const sendRequest = useCallback(async (targetUserId) => {
    const { data, error } = await supabase.rpc('send_friend_request', { target: targetUserId })
    if (error) throw error
    return data // 'sent' | 'accepted' | 'exists' | 'self'
  }, [])

  const acceptRequest = useCallback(async (friendshipId) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', friendshipId)
    if (error) throw error
  }, [])

  // Sirve para rechazar una solicitud o para eliminar a un amigo.
  const removeFriendship = useCallback(async (friendshipId) => {
    const { error } = await supabase.from('friendships').delete().eq('id', friendshipId)
    if (error) throw error
  }, [])

  const getFriendProfile = useCallback(async (userId) => {
    const { data, error } = await supabase.rpc('friend_profile', { target: userId })
    if (error) throw error
    return data // objeto público o null si no hay permiso
  }, [])

  return { searchUsers, listFriends, listRequests, sendRequest, acceptRequest, removeFriendship, getFriendProfile }
}
