import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { Dumbbell } from 'lucide-react'
import { sileo } from 'sileo'
import { useAuthStore } from '../../stores/authStore'
import { useOAuthLogin } from '../../hooks/useOAuthLogin'

const loginSchema = z.object({
  email: z.string().email('Ingresa un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export default function Login() {
  const navigate = useNavigate()
  const signIn = useAuthStore((s) => s.signIn)
  const { oauthLoading, handleOAuth } = useOAuthLogin()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) })

  const onSubmit = async ({ email, password }) => {
    const { error } = await signIn(email, password)
    if (error) {
      sileo.error({ title: 'Credenciales incorrectas', description: 'Revisá tu email y contraseña.' })
      setError('root', { message: 'Email o contraseña incorrectos' })
      return
    }
    sileo.success({ title: '¡Bienvenido de vuelta!' })
    navigate('/')
  }

  return (
    <AuthShell>
      <div className="card p-7">
        <h1 className="font-display font-bold uppercase tracking-tight text-2xl text-zinc-100">
          Iniciar sesión
        </h1>
        <p className="text-sm text-zinc-500 mt-1 mb-6">Continúa donde lo dejaste.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="field-label">Email</label>
            <input type="email" autoComplete="email" {...register('email')} className="input" placeholder="tu@email.com" />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="field-label">Contraseña</label>
            <input type="password" autoComplete="current-password" {...register('password')} className="input" placeholder="••••••••" />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {errors.root && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5">
              {errors.root.message}
            </p>
          )}

          <button type="submit" disabled={isSubmitting || oauthLoading !== null} className="btn-accent w-full py-3 text-sm">
            {isSubmitting ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <Divider />

        <OAuthButton
          label="Continuar con Google"
          loading={oauthLoading === 'google'}
          disabled={isSubmitting || oauthLoading !== null}
          onClick={() => handleOAuth('google')}
        />
      </div>

      <p className="text-sm text-zinc-500 text-center mt-5">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="text-accent hover:text-accent-bright font-semibold">
          Registrate
        </Link>
      </p>
    </AuthShell>
  )
}

export function OAuthButton({ label, loading, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 rounded-2xl px-4 py-3 border border-ink-700 bg-ink-850 hover:border-ink-600 hover:bg-ink-800 active:scale-[0.98] transition-all text-sm text-zinc-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <span className="w-4 h-4 rounded-full border-2 border-zinc-500 border-t-zinc-200 animate-spin shrink-0" />
      ) : (
        <GoogleIcon />
      )}
      {loading ? 'Conectando…' : label}
    </button>
  )
}

export function Divider() {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-ink-700" />
      <span className="text-xs text-zinc-600 uppercase tracking-wider">o</span>
      <div className="flex-1 h-px bg-ink-700" />
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

export function BrandMark() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center glow-accent">
        <Dumbbell size={28} className="text-ink-950" strokeWidth={2.5} />
      </div>
      <p className="font-display font-bold uppercase tracking-[0.15em] text-3xl text-zinc-100 mt-4 leading-none">
        Forge
      </p>
      <p className="eyebrow mt-2">Forjá tu progreso</p>
    </div>
  )
}

export function AuthShell({ children }) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-ink-950">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full bg-accent/15 blur-[130px]" />
      <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <BrandMark />
        <div className="w-full max-w-md mt-9">{children}</div>
      </div>
    </div>
  )
}
