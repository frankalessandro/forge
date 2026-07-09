import { useState } from 'react'
import { sileo } from 'sileo'
import { useAuthStore } from '../stores/authStore'

// Estado y handler del login con OAuth, compartidos entre Login y Register
// (son idénticos en ambas pantallas: solo cambia el botón que los dispara).
export function useOAuthLogin() {
  const signInWithOAuth = useAuthStore((s) => s.signInWithOAuth)
  const [oauthLoading, setOauthLoading] = useState(null)

  const handleOAuth = async (provider) => {
    setOauthLoading(provider)
    const { error } = await signInWithOAuth(provider)
    if (error) {
      sileo.error({ title: 'Error al conectar', description: error.message })
      setOauthLoading(null)
    }
  }

  return { oauthLoading, handleOAuth }
}
