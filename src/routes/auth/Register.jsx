import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Flame, Dumbbell, Zap, Activity, Heart, Check, MailCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../hooks/useProfile'
import { useRoutines } from '../../hooks/useRoutines'
import { levelFromActivity } from '../../utils/routineTemplates'
import { GENDERS, ACTIVITY_LEVELS } from '../../utils/healthMetrics'
import { AuthShell } from './Login'

const credentialsSchema = z
  .object({
    email: z.string().email('Ingresa un email válido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

const GOALS = [
  { value: 'gain_muscle', label: 'Ganar músculo', icon: Dumbbell },
  { value: 'lose_fat', label: 'Perder grasa', icon: Flame },
  { value: 'strength', label: 'Fuerza', icon: Zap },
  { value: 'endurance', label: 'Resistencia', icon: Activity },
  { value: 'health', label: 'Salud general', icon: Heart },
]

const ONBOARDING_STEPS = 5

export default function Register() {
  const navigate = useNavigate()
  const { updateProfile, addBodyStat } = useProfile()
  const { generateForGoal } = useRoutines()

  // step 0 = credenciales · 1..5 = entrevista · 'confirm' = requiere verificar email
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState({
    name: '',
    birth_date: '',
    gender: '',
    height_cm: '',
    weight_kg: '',
    activity_level: '',
    training_days_per_week: '',
    goal: '',
  })
  const [saving, setSaving] = useState(false)

  const set = (patch) => setProfile((p) => ({ ...p, ...patch }))

  // ── Paso 0: credenciales ───────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(credentialsSchema) })

  const onCreateAccount = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError('root', { message: 'No se pudo crear la cuenta. Prueba con otro email.' })
      return
    }
    // Si hay sesión, seguimos a la entrevista. Si no, hay que confirmar el email.
    if (data.session) setStep(1)
    else setStep('confirm')
  }

  // ── Finalizar entrevista ───────────────────────────────────────────────
  const finish = async () => {
    setSaving(true)
    const payload = {}
    if (profile.name.trim()) payload.name = profile.name.trim()
    if (profile.birth_date) payload.birth_date = profile.birth_date
    if (profile.gender) payload.gender = profile.gender
    if (profile.height_cm) payload.height_cm = Number(profile.height_cm)
    if (profile.weight_kg) payload.weight_kg = Number(profile.weight_kg)
    if (profile.activity_level) payload.activity_level = profile.activity_level
    if (profile.training_days_per_week !== '') payload.training_days_per_week = Number(profile.training_days_per_week)
    if (profile.goal) payload.goal = profile.goal

    if (Object.keys(payload).length) await updateProfile(payload)
    if (profile.weight_kg) await addBodyStat(Number(profile.weight_kg))

    // Genera una rutina inicial a partir del objetivo elegido. No bloquea el
    // onboarding: si falla, el usuario igual entra y puede generarla luego.
    if (profile.goal) {
      try {
        await generateForGoal({
          goal: profile.goal,
          level: levelFromActivity(profile.activity_level),
          daysPerWeek: profile.training_days_per_week !== '' ? Number(profile.training_days_per_week) : 3,
        })
      } catch {
        // silencioso: la generación es un extra, no un requisito del registro
      }
    }

    navigate('/app/dashboard', { replace: true })
  }

  const next = () => setStep((s) => s + 1)
  const back = () => setStep((s) => Math.max(1, s - 1))

  // ── Render ─────────────────────────────────────────────────────────────
  if (step === 'confirm') {
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
          <Link to="/login" className="btn-accent w-full py-3 text-sm mt-6">Ir a iniciar sesión</Link>
        </div>
      </AuthShell>
    )
  }

  if (step === 0) {
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
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
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

            <button type="submit" disabled={isSubmitting} className="btn-accent w-full py-3 text-sm">
              {isSubmitting ? 'Creando cuenta…' : 'Continuar'}
            </button>
          </form>
        </div>

        <p className="text-sm text-zinc-500 text-center mt-5">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-accent hover:text-accent-bright font-semibold">Inicia sesión</Link>
        </p>
      </AuthShell>
    )
  }

  // ── Entrevista ─────────────────────────────────────────────────────────
  return (
    <AuthShell>
      <div className="card p-7">
        <Progress step={step} />

        {step === 1 && (
          <Step
            eyebrow="Paso 1 de 5"
            title="¿Cómo te llamas?"
            subtitle="Así personalizamos tu experiencia."
          >
            <input
              autoFocus
              type="text"
              value={profile.name}
              onChange={(e) => set({ name: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && next()}
              className="input text-center text-lg py-3"
              placeholder="Tu nombre"
            />
          </Step>
        )}

        {step === 2 && (
          <Step eyebrow="Paso 2 de 5" title="Sobre ti" subtitle="Lo usamos para tu TMB, IMC y zonas de FC.">
            <label className="block mb-4">
              <span className="field-label">Fecha de nacimiento</span>
              <input
                type="date"
                value={profile.birth_date}
                onChange={(e) => set({ birth_date: e.target.value })}
                className="input text-center text-lg py-3"
              />
            </label>
            <span className="field-label">Género</span>
            <div className="grid grid-cols-2 gap-3">
              {GENDERS.map(({ value, label }) => {
                const active = profile.gender === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set({ gender: value })}
                    className={`rounded-2xl px-4 py-3 border transition-colors display text-sm ${
                      active ? 'bg-accent/10 border-accent/50 text-accent' : 'bg-ink-850 border-ink-700 hover:border-ink-600 text-zinc-200'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </Step>
        )}

        {step === 3 && (
          <Step eyebrow="Paso 3 de 5" title="Tus medidas" subtitle="En kg y cm. Lo usamos para tu IMC y progreso.">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="field-label">Altura (cm)</span>
                <input
                  autoFocus
                  type="number"
                  step="0.1"
                  value={profile.height_cm}
                  onChange={(e) => set({ height_cm: e.target.value })}
                  className="input text-center text-lg py-3"
                  placeholder="175"
                />
              </label>
              <label className="block">
                <span className="field-label">Peso (kg)</span>
                <input
                  type="number"
                  step="0.1"
                  value={profile.weight_kg}
                  onChange={(e) => set({ weight_kg: e.target.value })}
                  className="input text-center text-lg py-3"
                  placeholder="70"
                />
              </label>
            </div>
          </Step>
        )}

        {step === 4 && (
          <Step eyebrow="Paso 4 de 5" title="¿Qué tan activo eres?" subtitle="Tu nivel de actividad y cuántos días entrenas.">
            <div className="space-y-2.5">
              {ACTIVITY_LEVELS.map(({ value, label, desc }) => {
                const active = profile.activity_level === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set({ activity_level: value })}
                    className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 border transition-colors text-left ${
                      active ? 'bg-accent/10 border-accent/50' : 'bg-ink-850 border-ink-700 hover:border-ink-600'
                    }`}
                  >
                    <div className="flex-1">
                      <span className={`display text-sm ${active ? 'text-accent' : 'text-zinc-200'}`}>{label}</span>
                      <span className="block text-xs text-zinc-500">{desc}</span>
                    </div>
                    {active && <Check size={18} className="text-accent shrink-0" strokeWidth={3} />}
                  </button>
                )
              })}
            </div>
            <label className="block mt-4">
              <span className="field-label">Días de entreno por semana</span>
              <input
                type="number"
                min="0"
                max="7"
                value={profile.training_days_per_week}
                onChange={(e) => set({ training_days_per_week: e.target.value })}
                className="input text-center text-lg py-3"
                placeholder="4"
              />
            </label>
          </Step>
        )}

        {step === 5 && (
          <Step eyebrow="Paso 5 de 5" title="¿Cuál es tu objetivo?" subtitle="Vamos a orientar tus rutinas a esto.">
            <div className="space-y-2.5">
              {GOALS.map(({ value, label, icon: Icon }) => {
                const active = profile.goal === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set({ goal: value })}
                    className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 border transition-colors text-left ${
                      active ? 'bg-accent/10 border-accent/50' : 'bg-ink-850 border-ink-700 hover:border-ink-600'
                    }`}
                  >
                    <div className={`rounded-xl p-2 shrink-0 ${active ? 'bg-accent text-ink-950' : 'bg-ink-800 text-accent'}`}>
                      <Icon size={18} />
                    </div>
                    <span className={`display text-sm flex-1 ${active ? 'text-accent' : 'text-zinc-200'}`}>{label}</span>
                    {active && <Check size={18} className="text-accent shrink-0" strokeWidth={3} />}
                  </button>
                )
              })}
            </div>
          </Step>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 mt-7">
          {step > 1 && (
            <button onClick={back} className="btn-dark px-4 py-3 text-sm shrink-0" type="button">
              <ArrowLeft size={16} />
            </button>
          )}
          {step < ONBOARDING_STEPS ? (
            <button onClick={next} className="btn-accent flex-1 py-3 text-sm" type="button">
              Continuar
              <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={finish} disabled={saving} className="btn-accent flex-1 py-3 text-sm" type="button">
              {saving ? 'Guardando…' : 'Empezar a entrenar'}
              <Check size={16} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>

      <button
        onClick={finish}
        disabled={saving}
        className="block w-full text-center text-sm text-zinc-500 hover:text-zinc-300 mt-5 transition-colors"
      >
        Saltar por ahora
      </button>
    </AuthShell>
  )
}

function Progress({ step }) {
  return (
    <div className="flex gap-1.5 mb-6">
      {Array.from({ length: ONBOARDING_STEPS }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors ${i < step ? 'bg-accent' : 'bg-ink-700'}`}
        />
      ))}
    </div>
  )
}

function Step({ eyebrow, title, subtitle, children }) {
  return (
    <div>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="font-display font-bold uppercase tracking-tight text-2xl text-zinc-100 mt-1 leading-none">
        {title}
      </h1>
      {subtitle && <p className="text-sm text-zinc-500 mt-2 mb-5">{subtitle}</p>}
      {children}
    </div>
  )
}
