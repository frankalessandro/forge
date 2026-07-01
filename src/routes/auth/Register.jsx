import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { sileo } from 'sileo'
import { useAuthStore } from '../../stores/authStore'
import { useOAuthLogin } from '../../hooks/useOAuthLogin'
import { AuthShell, OAuthButton, Divider } from './Login'

// Requisitos de contraseña fuerte. Zod evalúa en orden y muestra el primer
// mensaje que falle, así el usuario va corrigiendo de a uno.
const credentialsSchema = z
  .object({
    email: z.string().email('Ingresa un email válido'),
    password: z
      .string()
      .min(8, 'Usa al menos 8 caracteres')
      .regex(/[A-Z]/, 'Incluye al menos una mayúscula (A-Z)')
      .regex(/[a-z]/, 'Incluye al menos una minúscula (a-z)')
      .regex(/[0-9]/, 'Incluye al menos un número (0-9)')
      .regex(/[^A-Za-z0-9]/, 'Incluye al menos un símbolo (!@#$…)'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export default function Register() {
  // Si signUp devuelve sesión (sin confirmación de email), GuestOnly redirige
  // sola a /app/onboarding apenas se publica la sesión. La encuesta vive ahí
  // (Onboarding.jsx), igual que para el flujo de Google.
  const [confirmEmail, setConfirmEmail] = useState(false)
  const signUp = useAuthStore((s) => s.signUp)
  const { oauthLoading, handleOAuth } = useOAuthLogin()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(credentialsSchema) })

  const onCreateAccount = async ({ email, password }) => {
    const { data, error } = await signUp(email, password)
    if (error) {
      sileo.error({ title: 'Error al crear cuenta', description: 'Probá con otro email.' })
      setError('root', { message: 'No se pudo crear la cuenta. Prueba con otro email.' })
      return
    }
    if (data.session) {
      sileo.success({ title: 'Cuenta creada', description: 'Completá tu perfil para empezar.' })
    } else {
      setConfirmEmail(true)
    }
  }

  if (confirmEmail) {
    return (
      <AuthShell>
        <div className="card p-7 text-center">
          <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mx-auto mb-4">
            <MailCheck size={24} />
          </div>
          <h1 className="font-display font-bold uppercase tracking-tight text-xl text-zinc-100">Revisa tu email</h1>
          <p className="text-sm text-zinc-500 mt-2">
            Te enviamos un enlace para confirmar tu cuenta. Después de confirmarla, inicia sesión.
          </p>
          <Link to="/login" className="btn-accent w-full py-3 text-sm mt-6 block text-center">Ir a iniciar sesión</Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="card p-7">
        <h1 className="font-display font-bold uppercase tracking-tight text-2xl text-zinc-100">Crear cuenta</h1>
        <p className="text-sm text-zinc-500 mt-1 mb-6">Empieza a registrar tu progreso.</p>

        <form onSubmit={handleSubmit(onCreateAccount)} className="space-y-4">
          <div>
            <label className="field-label">Email</label>
            <input type="email" autoComplete="email" {...register('email')} className="input" placeholder="tu@email.com" />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="field-label">Contraseña</label>
            <input type="password" autoComplete="new-password" {...register('password')} className="input" placeholder="••••••••" />
            {errors.password ? (
              <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
            ) : (
              <p className="text-xs text-zinc-600 mt-1">Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo.</p>
            )}
          </div>
          <div>
            <label className="field-label">Confirmar contraseña</label>
            <input type="password" autoComplete="new-password" {...register('confirmPassword')} className="input" placeholder="••••••••" />
            {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          {errors.root && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5">
              {errors.root.message}
            </p>
          )}

          <button type="submit" disabled={isSubmitting || oauthLoading !== null} className="btn-accent w-full py-3 text-sm">
            {isSubmitting ? 'Creando cuenta…' : 'Continuar'}
          </button>
        </form>

        <Divider />

        <OAuthButton
          label="Registrarse con Google"
          loading={oauthLoading === 'google'}
          disabled={isSubmitting || oauthLoading !== null}
          onClick={() => handleOAuth('google')}
        />
      </div>

      <p className="text-sm text-zinc-500 text-center mt-5">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="text-accent hover:text-accent-bright font-semibold">Inicia sesión</Link>
      </p>
    </AuthShell>
  )
}
