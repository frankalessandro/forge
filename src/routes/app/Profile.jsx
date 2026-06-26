import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LogOut } from 'lucide-react'
import { ResponsiveContainer, LineChart, XAxis, YAxis, Tooltip, Line } from 'recharts'
import { supabase } from '../../lib/supabase'
import { useProfile } from '../../hooks/useProfile'
import PageHeader from '../../components/ui/PageHeader'

const profileSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').optional().or(z.literal('')),
  birth_date: z.string().optional().or(z.literal('')),
  height_cm: z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().positive().optional()),
  weight_kg: z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().positive().optional()),
  goal: z.enum(['lose_fat', 'gain_muscle', 'strength', 'endurance', 'health', '']).optional(),
})

const GOAL_LABELS = {
  lose_fat: 'Perder grasa',
  gain_muscle: 'Ganar músculo',
  strength: 'Fuerza',
  endurance: 'Resistencia',
  health: 'Salud general',
}

function calcBMI(weight_kg, height_cm) {
  if (!weight_kg || !height_cm) return null
  return weight_kg / Math.pow(height_cm / 100, 2)
}

function bmiCategory(bmi) {
  if (bmi < 18.5) return { label: 'Bajo peso', color: 'text-sky-300 bg-sky-400/10 border-sky-400/25' }
  if (bmi < 25) return { label: 'Normal', color: 'text-accent bg-accent/10 border-accent/25' }
  if (bmi < 30) return { label: 'Sobrepeso', color: 'text-amber-300 bg-amber-400/10 border-amber-400/25' }
  return { label: 'Obesidad', color: 'text-red-300 bg-red-400/10 border-red-400/25' }
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

  useEffect(() => {
    async function load() {
      const { data } = await getProfile()
      if (data) {
        reset({
          name: data.name ?? '',
          birth_date: data.birth_date ?? '',
          height_cm: data.height_cm ?? '',
          weight_kg: data.weight_kg ?? '',
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
    if (values.height_cm !== undefined) clean.height_cm = values.height_cm
    if (values.weight_kg !== undefined) clean.weight_kg = values.weight_kg
    if (values.goal !== undefined && values.goal !== '') clean.goal = values.goal

    const { error } = await updateProfile(clean)
    if (error) setSaveStatus({ type: 'error', msg: error.message })
    else setSaveStatus({ type: 'success', msg: 'Perfil guardado correctamente.' })
  }

  async function handleAddStat(e) {
    e.preventDefault()
    setStatError(null)
    const w = parseFloat(statWeight)
    if (!w || w <= 0) { setStatError('Ingresá un peso válido.'); return }
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

  const bmi = calcBMI(Number(watchedWeight), Number(watchedHeight))
  const bmiInfo = bmi ? bmiCategory(bmi) : null
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
              <div>
                <p className="font-display font-bold uppercase tracking-tight text-xl text-zinc-100 leading-none">
                  {avatarName || 'Sin nombre'}
                </p>
                <p className="text-sm text-zinc-500 mt-1">Editá tu perfil abajo</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="card p-5 space-y-4">
              <h2 className="section-title">Datos personales</h2>

              <div>
                <label className="field-label">Nombre</label>
                <input type="text" {...register('name')} className="input" placeholder="Tu nombre" />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="field-label">Fecha de nacimiento</label>
                <input type="date" {...register('birth_date')} className="input" />
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

            {bmiInfo && (
              <div className={`border rounded-2xl p-4 ${bmiInfo.color}`}>
                <p className="eyebrow opacity-80">Índice de masa corporal</p>
                <p className="stat-num text-3xl mt-1">{bmi.toFixed(1)}</p>
                <p className="text-sm font-medium mt-0.5">{bmiInfo.label}</p>
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
    </div>
  )
}
