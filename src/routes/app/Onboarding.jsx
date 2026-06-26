import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Flame, Dumbbell, Zap, Activity, Heart, Check } from 'lucide-react'
import { sileo } from 'sileo'
import { useAuthStore } from '../../stores/authStore'
import { useProfile } from '../../hooks/useProfile'
import { useRoutines } from '../../hooks/useRoutines'
import { levelFromActivity } from '../../utils/routineTemplates'
import { GENDERS, ACTIVITY_LEVELS } from '../../utils/healthMetrics'
import { AuthShell } from '../auth/Login'

const GOALS = [
  { value: 'gain_muscle', label: 'Ganar músculo', icon: Dumbbell },
  { value: 'lose_fat', label: 'Perder grasa', icon: Flame },
  { value: 'strength', label: 'Fuerza', icon: Zap },
  { value: 'endurance', label: 'Resistencia', icon: Activity },
  { value: 'health', label: 'Salud general', icon: Heart },
]

const STEPS = 6
const TRAINING_DAYS = [2, 3, 4, 5, 6, 7]
const MAX_GOALS = 3

export default function Onboarding() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const needsOnboarding = useAuthStore((s) => s.needsOnboarding)
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding)
  const { updateProfile } = useProfile()
  const { generateForGoal } = useRoutines()

  const meta = user?.user_metadata ?? {}

  const [step, setStep] = useState(1)
  const [data, setData] = useState({
    name: meta.full_name ?? meta.name ?? '',
    birth_date: '',
    gender: '',
    height_cm: '',
    weight_kg: '',
    activity_level: '',
    training_days_per_week: '',
    goals: [],
  })
  const [saving, setSaving] = useState(false)

  // Si ya completó el onboarding en otra pestaña o volvió atrás, mandar al dashboard
  useEffect(() => {
    if (!needsOnboarding) navigate('/app/dashboard', { replace: true })
  }, [needsOnboarding, navigate])

  const patch = (update) => setData((d) => ({ ...d, ...update }))

  const toggleGoal = (value) =>
    setData((d) => {
      const has = d.goals.includes(value)
      if (has) return { ...d, goals: d.goals.filter((g) => g !== value) }
      if (d.goals.length >= MAX_GOALS) return d
      return { ...d, goals: [...d.goals, value] }
    })

  const finish = async () => {
    setSaving(true)
    const payload = {}
    if (data.name.trim()) payload.name = data.name.trim()
    if (data.birth_date) payload.birth_date = data.birth_date
    if (data.gender) payload.gender = data.gender
    if (data.height_cm) payload.height_cm = Number(data.height_cm)
    if (data.weight_kg) payload.weight_kg = Number(data.weight_kg)
    if (data.activity_level) payload.activity_level = data.activity_level
    if (data.training_days_per_week !== '') payload.training_days_per_week = Number(data.training_days_per_week)
    if (data.goals.length) {
      payload.goals = data.goals
      payload.goal = data.goals[0] // principal, para rutinas y perfil
    }
    // Guarda la foto de Google en el perfil
    if (meta.avatar_url) payload.avatar_url = meta.avatar_url

    await updateProfile(payload)

    if (data.goals.length) {
      try {
        await generateForGoal({
          goal: data.goals[0],
          level: levelFromActivity(data.activity_level),
          daysPerWeek: data.training_days_per_week !== '' ? Number(data.training_days_per_week) : 3,
        })
      } catch {
        // silencioso
      }
    }

    completeOnboarding()
    sileo.success({ title: '¡Todo listo! A entrenar.' })
    navigate('/app/dashboard', { replace: true })
  }

  const next = () => setStep((s) => Math.min(s + 1, STEPS))
  const back = () => setStep((s) => Math.max(s - 1, 1))

  return (
    <AuthShell>
      {meta.avatar_url && (
        <div className="flex justify-center mb-6 -mt-2">
          <img
            src={meta.avatar_url}
            alt="Tu foto"
            className="w-20 h-20 rounded-2xl object-cover border-2 border-accent/30"
          />
        </div>
      )}

      <div className="card p-7">
        <Progress step={step} />

        {step === 1 && (
          <Step eyebrow="Paso 1 de 6" title="¿Cómo te llamas?" subtitle="Así personalizamos tu experiencia.">
            <input
              autoFocus
              type="text"
              value={data.name}
              onChange={(e) => patch({ name: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && next()}
              className="input text-center text-lg py-3"
              placeholder="Tu nombre"
            />
          </Step>
        )}

        {step === 2 && (
          <Step eyebrow="Paso 2 de 6" title="Sobre ti" subtitle="Lo usamos para tu TMB, IMC y zonas de FC.">
            <label className="block mb-4">
              <span className="field-label">Fecha de nacimiento</span>
              <input
                type="date"
                value={data.birth_date}
                onChange={(e) => patch({ birth_date: e.target.value })}
                className="input text-center text-lg py-3"
              />
            </label>
            <span className="field-label">Género</span>
            <div className="grid grid-cols-2 gap-3">
              {GENDERS.map(({ value, label }) => {
                const active = data.gender === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => patch({ gender: value })}
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
          <Step eyebrow="Paso 3 de 6" title="Tus medidas" subtitle="En kg y cm. Lo usamos para tu IMC y progreso.">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="field-label">Altura (cm)</span>
                <input
                  autoFocus
                  type="number"
                  step="0.1"
                  value={data.height_cm}
                  onChange={(e) => patch({ height_cm: e.target.value })}
                  className="input text-center text-lg py-3"
                  placeholder="175"
                />
              </label>
              <label className="block">
                <span className="field-label">Peso (kg)</span>
                <input
                  type="number"
                  step="0.1"
                  value={data.weight_kg}
                  onChange={(e) => patch({ weight_kg: e.target.value })}
                  className="input text-center text-lg py-3"
                  placeholder="70"
                />
              </label>
            </div>
          </Step>
        )}

        {step === 4 && (
          <Step eyebrow="Paso 4 de 6" title="¿Qué tan activo eres?" subtitle="Lo usamos para calibrar tus rutinas.">
            <div className="space-y-2.5">
              {ACTIVITY_LEVELS.map(({ value, label, desc }) => {
                const active = data.activity_level === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => patch({ activity_level: value })}
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
          </Step>
        )}

        {step === 5 && (
          <Step
            eyebrow="Paso 5 de 6"
            title="¿Cuántos días por semana?"
            subtitle="Esta es tu meta semanal: tu racha se mantiene mientras la cumplas, entrenes los días que entrenes."
          >
            <div className="grid grid-cols-3 gap-3">
              {TRAINING_DAYS.map((n) => {
                const active = Number(data.training_days_per_week) === n
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => patch({ training_days_per_week: String(n) })}
                    className={`flex flex-col items-center gap-1 rounded-2xl px-4 py-4 border transition-colors ${
                      active ? 'bg-accent/10 border-accent/50 text-accent' : 'bg-ink-850 border-ink-700 hover:border-ink-600 text-zinc-200'
                    }`}
                  >
                    <span className="stat-num text-3xl leading-none">{n}</span>
                    <span className="text-xs text-zinc-500">{n === 7 ? 'todos' : 'días'}</span>
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs text-zinc-500 bg-accent/5 border border-accent/15 rounded-xl px-3.5 py-2.5">
              <Flame size={14} className="text-accent shrink-0" />
              <span>Podrás cambiar esta meta cuando quieras desde tu perfil.</span>
            </div>
          </Step>
        )}

        {step === 6 && (
          <Step
            eyebrow="Paso 6 de 6"
            title="¿Cuáles son tus objetivos?"
            subtitle="Elige hasta 3. El primero orienta tus rutinas generadas."
          >
            <div className="space-y-2.5">
              {GOALS.map(({ value, label, icon: Icon }) => {
                const active = data.goals.includes(value)
                const disabled = !active && data.goals.length >= MAX_GOALS
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleGoal(value)}
                    disabled={disabled}
                    className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 border transition-colors text-left ${
                      active
                        ? 'bg-accent/10 border-accent/50'
                        : `bg-ink-850 border-ink-700 ${disabled ? 'opacity-40' : 'hover:border-ink-600'}`
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

        <div className="flex items-center gap-3 mt-7">
          {step > 1 && (
            <button onClick={back} className="btn-dark px-4 py-3 text-sm shrink-0" type="button">
              <ArrowLeft size={16} />
            </button>
          )}
          {step < STEPS ? (
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
      {Array.from({ length: STEPS }).map((_, i) => (
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
