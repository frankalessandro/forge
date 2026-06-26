import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
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
      <h1 className="font-display font-bold uppercase tracking-tight text-3xl text-zinc-100 mb-1">
        Bienvenido
      </h1>
      <p className="text-sm text-zinc-500 mb-7">Entrá y seguí forjando.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="field-label">Email</label>
          <input type="email" {...register('email')} className="input" placeholder="tu@email.com" />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="field-label">Contraseña</label>
          <input type="password" {...register('password')} className="input" placeholder="••••••••" />
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

      <p className="text-sm text-zinc-500 text-center mt-6">
        ¿No tenés cuenta?{' '}
        <Link to="/register" className="text-accent hover:text-accent-bright font-semibold">
          Registrate
        </Link>
      </p>
    </AuthShell>
  )
}

export function AuthShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-ink-950">
      {/* Brand band */}
      <div className="relative overflow-hidden bg-accent text-ink-950 px-6 pt-14 pb-12">
        <p className="font-display uppercase tracking-[0.3em] text-xs font-semibold opacity-70">
          Gym tracker
        </p>
        <p className="font-display font-bold uppercase tracking-tight text-6xl leading-none mt-2">
          Forge
        </p>
      </div>
      <div className="flex-1 flex items-start justify-center px-6 -mt-6">
        <div className="w-full max-w-md card p-7">{children}</div>
      </div>
    </div>
  )
}
