import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { AuthShell } from './Login'

const registerSchema = z
  .object({
    email: z.string().email('Ingresá un email válido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export default function Register() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema) })

  const onSubmit = async ({ email, password }) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError('root', { message: 'No se pudo crear la cuenta. Intentá de nuevo.' })
      return
    }
    navigate('/app/dashboard')
  }

  return (
    <AuthShell>
      <h1 className="font-display font-bold uppercase tracking-tight text-3xl text-zinc-100 mb-1">
        Crear cuenta
      </h1>
      <p className="text-sm text-zinc-500 mb-7">Empezá a registrar tu progreso.</p>

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

        <div>
          <label className="field-label">Confirmar contraseña</label>
          <input type="password" {...register('confirmPassword')} className="input" placeholder="••••••••" />
          {errors.confirmPassword && (
            <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        {errors.root && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5">
            {errors.root.message}
          </p>
        )}

        <button type="submit" disabled={isSubmitting} className="btn-accent w-full py-3 text-sm">
          {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>

      <p className="text-sm text-zinc-500 text-center mt-6">
        ¿Ya tenés cuenta?{' '}
        <Link to="/login" className="text-accent hover:text-accent-bright font-semibold">
          Iniciá sesión
        </Link>
      </p>
    </AuthShell>
  )
}
