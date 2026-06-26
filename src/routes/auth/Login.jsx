import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { Dumbbell } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const loginSchema = z.object({
  email: z.string().email('Ingresá un email válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export default function Login() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) })

  const onSubmit = async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('root', { message: 'Email o contraseña incorrectos' })
      return
    }
    navigate('/app/dashboard')
  }

  return (
    <AuthShell>
      <div className="card p-7">
        <h1 className="font-display font-bold uppercase tracking-tight text-2xl text-zinc-100">
          Iniciar sesión
        </h1>
        <p className="text-sm text-zinc-500 mt-1 mb-6">Seguí donde lo dejaste.</p>

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

          <button type="submit" disabled={isSubmitting} className="btn-accent w-full py-3 text-sm">
            {isSubmitting ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>

      <p className="text-sm text-zinc-500 text-center mt-5">
        ¿No tenés cuenta?{' '}
        <Link to="/register" className="text-accent hover:text-accent-bright font-semibold">
          Registrate
        </Link>
      </p>
    </AuthShell>
  )
}

/** Marca + fondo compartido para las pantallas de auth. */
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
      {/* Glow ambiental */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full bg-accent/15 blur-[130px]" />
      <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <BrandMark />
        <div className="w-full max-w-md mt-9">{children}</div>
      </div>
    </div>
  )
}
