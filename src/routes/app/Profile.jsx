import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LogOut, Info, Users } from 'lucide-react'
import { ResponsiveContainer, LineChart, XAxis, YAxis, Tooltip, Line } from 'recharts'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../hooks/useProfile'
import PageHeader from '../../components/ui/PageHeader'
import Sheet from '../../components/ui/Sheet'
import AchievementsPanel from '../../components/features/AchievementsPanel'
import {
  GENDERS,
  ACTIVITY_LEVELS,
  calcAge,
  calcBMI,
  bmiCategory,
  calcBMR,
  calcMaxHR,
  calcHRZones,
  healthyWeightRange,
} from '../../utils/healthMetrics'

const profileSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').optional().or(z.literal('')),
  birth_date: z.string().optional().or(z.literal('')),
  gender: z.enum(['male', 'female', '']).optional(),
  height_cm: z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().positive().optional()),
  weight_kg: z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().positive().optional()),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active', '']).optional(),
  training_days_per_week: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().int().min(0).max(7).optional(),
  ),
  goal: z.enum(['lose_fat', 'gain_muscle', 'strength', 'endurance', 'health', '']).optional(),
})

const GOAL_LABELS = {
  lose_fat: 'Perder grasa',
  gain_muscle: 'Ganar músculo',
  strength: 'Fuerza',
  endurance: 'Resistencia',
  health: 'Salud general',
}

function formatDate(isoStr) {
  const d = new Date(isoStr)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}
function formatDateShort(isoStr) {
  const d = new Date(isoStr)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}
function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function Profile() {
  const navigate = useNavigate()
  const { getProfile, updateProfile, addBodyStat, getBodyStats } = useProfile()

  const [loading, setLoading] = useState(true)
  const [infoOpen, setInfoOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  const [bodyStats, setBodyStats] = useState([])
  const [statWeight, setStatWeight] = useState('')
  const [statDate, setStatDate] = useState(todayISO())
  const [statError, setStatError] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(profileSchema) })

  const watchedWeight = watch('weight_kg')
  const watchedHeight = watch('height_cm')
  const watchedBirth = watch('birth_date')
  const watchedGender = watch('gender')

  useEffect(() => {
    async function load() {
      const { data } = await getProfile()
      if (data) {
        reset({
          name: data.name ?? '',
          birth_date: data.birth_date ?? '',
          gender: data.gender ?? '',
          height_cm: data.height_cm ?? '',
          weight_kg: data.weight_kg ?? '',
          activity_level: data.activity_level ?? '',
          training_days_per_week: data.training_days_per_week ?? '',
          goal: data.goal ?? '',
        })
      }
      setLoading(false)
    }
    load()
    loadBodyStats()
  }, [])

  async function loadBodyStats() {
    const { data } = await getBodyStats()
    setBodyStats(data ?? [])
  }

  async function onSubmit(values) {
    setSaveStatus(null)
    const clean = {}
    if (values.name !== undefined && values.name !== '') clean.name = values.name
    if (values.birth_date !== undefined && values.birth_date !== '') clean.birth_date = values.birth_date
    if (values.gender !== undefined && values.gender !== '') clean.gender = values.gender
    if (values.height_cm !== undefined) clean.height_cm = values.height_cm
    if (values.weight_kg !== undefined) clean.weight_kg = values.weight_kg
    if (values.activity_level !== undefined && values.activity_level !== '') clean.activity_level = values.activity_level
    if (values.training_days_per_week !== undefined) clean.training_days_per_week = values.training_days_per_week
    if (values.goal !== undefined && values.goal !== '') clean.goal = values.goal

    const { error } = await updateProfile(clean)
    if (error) setSaveStatus({ type: 'error', msg: error.message })
    else setSaveStatus({ type: 'success', msg: 'Perfil guardado correctamente.' })
  }

  async function handleAddStat(e) {
    e.preventDefault()
    setStatError(null)
    const w = parseFloat(statWeight)
    if (!w || w <= 0) { setStatError('Ingresa un peso válido.'); return }
    const { error } = await addBodyStat(w, statDate ? new Date(statDate).toISOString() : undefined)
    if (error) { setStatError(error.message); return }
    setStatWeight('')
    setStatDate(todayISO())
    await loadBodyStats()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const weightNum = Number(watchedWeight) || null
  const heightNum = Number(watchedHeight) || null
  const age = calcAge(watchedBirth)

  const bmi = calcBMI(weightNum, heightNum)
  const bmiInfo = bmi ? bmiCategory(bmi) : null
  const bmr = calcBMR({ weightKg: weightNum, heightCm: heightNum, age, gender: watchedGender })
  const maxHR = calcMaxHR(age)
  const hrZones = calcHRZones(maxHR)
  const weightRange = healthyWeightRange(heightNum)

  const chartData = [...bodyStats].reverse().map((s) => ({ date: formatDateShort(s.recorded_at), weight: Number(s.weight_kg) }))
  const avatarName = watch('name')

  return (
    <div className="min-h-screen bg-ink-950">
      <PageHeader
        title="Mi perfil"
        back="/app/dashboard"
        right={
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-red-400 transition-colors">
            <LogOut size={16} />
            Salir
          </button>
        }
      />

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-6">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-20 card" />
            <div className="h-64 card" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center shrink-0">
                <span className="text-ink-950 text-2xl font-display font-bold">
                  {avatarName ? avatarName[0].toUpperCase() : '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold uppercase tracking-tight text-xl text-zinc-100 leading-none">
                  {avatarName || 'Sin nombre'}
                </p>
                <p className="text-sm text-zinc-500 mt-1">Edita tu perfil abajo</p>
              </div>
              <Link to="/app/friends" className="btn-dark px-3 py-2 text-xs shrink-0">
                <Users size={15} />
                Amigos
              </Link>
            </div>

            <AchievementsPanel />

            <form onSubmit={handleSubmit(onSubmit)} className="card p-5 space-y-4">
              <h2 className="section-title">Datos personales</h2>

              <div>
                <label className="field-label">Nombre</label>
                <input type="text" {...register('name')} className="input" placeholder="Tu nombre" />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Fecha de nacimiento</label>
                  <input type="date" {...register('birth_date')} className="input" />
                </div>
                <div>
                  <label className="field-label">Género</label>
                  <select {...register('gender')} className="input">
                    <option value="">Sin especificar</option>
                    {GENDERS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Altura (cm)</label>
                  <input type="number" step="0.1" {...register('height_cm')} className="input" placeholder="175" />
                  {errors.height_cm && <p className="text-xs text-red-400 mt-1">{errors.height_cm.message}</p>}
                </div>
                <div>
                  <label className="field-label">Peso (kg)</label>
                  <input type="number" step="0.1" {...register('weight_kg')} className="input" placeholder="70" />
                  {errors.weight_kg && <p className="text-xs text-red-400 mt-1">{errors.weight_kg.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Nivel de actividad</label>
                  <select {...register('activity_level')} className="input">
                    <option value="">Sin especificar</option>
                    {ACTIVITY_LEVELS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label">Días de entreno / semana</label>
                  <input type="number" min="0" max="7" {...register('training_days_per_week')} className="input" placeholder="4" />
                  {errors.training_days_per_week
                    ? <p className="text-xs text-red-400 mt-1">{errors.training_days_per_week.message}</p>
                    : <p className="text-xs text-zinc-600 mt-1">Es tu meta para mantener la racha.</p>}
                </div>
              </div>

              <div>
                <label className="field-label">Objetivo</label>
                <select {...register('goal')} className="input">
                  <option value="">Sin objetivo</option>
                  {Object.entries(GOAL_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              {saveStatus && (
                <p className={`text-sm px-3.5 py-2.5 rounded-xl border ${
                  saveStatus.type === 'success'
                    ? 'text-accent bg-accent/10 border-accent/25'
                    : 'text-red-400 bg-red-500/10 border-red-500/20'
                }`}>
                  {saveStatus.msg}
                </p>
              )}

              <button type="submit" disabled={isSubmitting} className="btn-accent w-full py-3 text-sm">
                {isSubmitting ? 'Guardando…' : 'Guardar perfil'}
              </button>
            </form>

            {(bmiInfo || bmr || maxHR || weightRange) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="section-title">Tus métricas</h2>
                  <button
                    type="button"
                    onClick={() => setInfoOpen(true)}
                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-accent transition-colors"
                  >
                    <Info size={14} />
                    ¿Qué significan?
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {bmiInfo && (
                    <div className={`border rounded-2xl p-4 ${bmiInfo.color}`}>
                      <p className="eyebrow opacity-80">IMC</p>
                      <p className="stat-num text-3xl mt-1">{bmi.toFixed(1)}</p>
                      <p className="text-sm font-medium mt-0.5">{bmiInfo.label}</p>
                    </div>
                  )}

                  {bmr && (
                    <div className="card p-4">
                      <p className="eyebrow text-zinc-500">TMB (Mifflin-St Jeor)</p>
                      <p className="stat-num text-3xl mt-1 text-zinc-100">{Math.round(bmr)}</p>
                      <p className="text-sm text-zinc-500 mt-0.5">kcal/día en reposo</p>
                    </div>
                  )}

                  {maxHR && (
                    <div className="card p-4">
                      <p className="eyebrow text-zinc-500">FC máxima</p>
                      <p className="stat-num text-3xl mt-1 text-zinc-100">{maxHR}</p>
                      <p className="text-sm text-zinc-500 mt-0.5">ppm (220 − edad)</p>
                    </div>
                  )}

                  {weightRange && (
                    <div className="card p-4">
                      <p className="eyebrow text-zinc-500">Peso saludable</p>
                      <p className="stat-num text-2xl mt-1 text-zinc-100">
                        {weightRange.min.toFixed(0)}–{weightRange.max.toFixed(0)}
                      </p>
                      <p className="text-sm text-zinc-500 mt-0.5">kg para tu altura</p>
                    </div>
                  )}
                </div>

                {hrZones.length > 0 && (
                  <div className="card p-5 space-y-3">
                    <h3 className="section-title">Zonas de frecuencia cardíaca</h3>
                    <ul className="space-y-1">
                      {hrZones.map((z) => (
                        <li key={z.zone} className="flex items-center justify-between text-sm py-1.5 border-b border-ink-800 last:border-0">
                          <span className="flex items-center gap-2.5">
                            <span className="display text-accent w-7">{z.zone}</span>
                            <span className="text-zinc-400">{z.name}</span>
                          </span>
                          <span className="stat-num text-base text-zinc-100">{z.low}–{z.high} ppm</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-zinc-600">Calculadas como % de tu FC máxima.</p>
                  </div>
                )}
              </div>
            )}

            <div className="card p-5 space-y-4">
              <h2 className="section-title">Registrar peso</h2>

              <form onSubmit={handleAddStat} className="flex gap-2">
                <input type="number" step="0.1" value={statWeight} onChange={(e) => setStatWeight(e.target.value)} placeholder="kg" className="input w-24 text-center" />
                <input type="date" value={statDate} onChange={(e) => setStatDate(e.target.value)} className="input flex-1" />
                <button type="submit" className="btn-accent px-4 text-sm shrink-0">Añadir</button>
              </form>

              {statError && <p className="text-xs text-red-400">{statError}</p>}

              {chartData.length > 1 && (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717a' }} stroke="#2a2a31" />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#71717a' }} width={36} stroke="#2a2a31" />
                    <Tooltip
                      contentStyle={{ background: '#17171b', border: '1px solid #2a2a31', borderRadius: 12, color: '#fafafa' }}
                      labelStyle={{ color: '#a1a1aa' }}
                    />
                    <Line type="monotone" dataKey="weight" stroke="#a3e635" dot={false} strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {bodyStats.length > 0 ? (
                <ul className="space-y-1">
                  {bodyStats.slice(0, 10).map((s) => (
                    <li key={s.id} className="flex justify-between text-sm text-zinc-300 py-1.5 border-b border-ink-800 last:border-0">
                      <span className="text-zinc-500">{formatDate(s.recorded_at)}</span>
                      <span className="stat-num text-base text-zinc-100">{s.weight_kg} kg</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500">No hay registros de peso todavía.</p>
              )}
            </div>
          </>
        )}
      </main>

      <Sheet open={infoOpen} onClose={() => setInfoOpen(false)} title="Qué significan tus métricas">
        <MetricsGuide />
      </Sheet>
    </div>
  )
}

function MetricsGuide() {
  return (
    <div className="max-h-[70vh] overflow-y-auto space-y-5 pb-2">
      <GuideItem title="IMC — Índice de masa corporal">
        Relaciona tu peso con tu altura (peso ÷ altura²). Es una referencia rápida del rango en
        el que está tu peso: bajo peso (&lt;18.5), normal (18.5–25), sobrepeso (25–30) u obesidad
        (&gt;30). No distingue músculo de grasa, así que en personas muy musculosas puede sobrestimar.
      </GuideItem>

      <GuideItem title="TMB — Tasa metabólica basal">
        Las calorías que tu cuerpo gasta en reposo absoluto solo para mantenerte vivo (respirar,
        latir, regular temperatura). La calculamos con la fórmula de <strong>Mifflin-St Jeor</strong>,
        hoy considerada la más precisa para población general. Necesita peso, altura, edad y género.
      </GuideItem>

      <GuideItem title="FC máxima — Frecuencia cardíaca máxima">
        El máximo de pulsaciones por minuto (ppm) que tu corazón puede alcanzar con seguridad.
        La estimamos con la fórmula clásica <strong>220 − edad</strong>. Es la base para definir tus
        zonas de entrenamiento.
      </GuideItem>

      <GuideItem title="Zonas de frecuencia cardíaca (Z1–Z5)">
        Rangos de pulsaciones, calculados como % de tu FC máxima, que indican la intensidad del
        esfuerzo. Te ayudan a entrenar con un objetivo concreto en lugar de “a ciegas”:
        <ul className="mt-2 space-y-1.5">
          <li><span className="display text-accent">Z1</span> · 50–60% — Recuperación, muy suave.</li>
          <li><span className="display text-accent">Z2</span> · 60–70% — Aeróbico, quema de grasa y resistencia base.</li>
          <li><span className="display text-accent">Z3</span> · 70–80% — Tempo, mejora la capacidad aeróbica.</li>
          <li><span className="display text-accent">Z4</span> · 80–90% — Umbral, esfuerzo alto y sostenido.</li>
          <li><span className="display text-accent">Z5</span> · 90–100% — Máximo, sprints e intervalos cortos.</li>
        </ul>
      </GuideItem>

      <GuideItem title="Peso saludable">
        El rango de peso (en kg) que corresponde a un IMC saludable (18.5–24.9) para tu altura.
        Es un objetivo orientativo, no una regla estricta.
      </GuideItem>

      <p className="text-xs text-zinc-600 leading-relaxed">
        Estos valores son estimaciones generales con fines informativos y no sustituyen el
        consejo de un profesional de la salud.
      </p>
    </div>
  )
}

function GuideItem({ title, children }) {
  return (
    <div>
      <h3 className="display text-sm text-zinc-100 mb-1.5">{title}</h3>
      <div className="text-sm text-zinc-400 leading-relaxed">{children}</div>
    </div>
  )
}
