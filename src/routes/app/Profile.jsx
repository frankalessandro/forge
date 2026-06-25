import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  Line,
} from 'recharts'
import { useProfile } from '../../hooks/useProfile'

const profileSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').optional().or(z.literal('')),
  birth_date: z.string().optional().or(z.literal('')),
  height_cm: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().positive().optional()
  ),
  weight_kg: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().positive().optional()
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

function calcBMI(weight_kg, height_cm) {
  if (!weight_kg || !height_cm) return null
  return weight_kg / Math.pow(height_cm / 100, 2)
}

function bmiCategory(bmi) {
  if (bmi < 18.5) return { label: 'Bajo peso', color: 'text-blue-600 bg-blue-50 border-blue-200' }
  if (bmi < 25) return { label: 'Normal', color: 'text-green-600 bg-green-50 border-green-200' }
  if (bmi < 30) return { label: 'Sobrepeso', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' }
  return { label: 'Obesidad', color: 'text-red-600 bg-red-50 border-red-200' }
}

function formatDate(isoStr) {
  const d = new Date(isoStr)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function formatDateShort(isoStr) {
  const d = new Date(isoStr)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}`
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
    if (error) {
      setSaveStatus({ type: 'error', msg: error.message })
    } else {
      setSaveStatus({ type: 'success', msg: 'Perfil guardado correctamente.' })
    }
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

  const bmi = calcBMI(Number(watchedWeight), Number(watchedHeight))
  const bmiInfo = bmi ? bmiCategory(bmi) : null

  const chartData = [...bodyStats]
    .reverse()
    .map((s) => ({ date: formatDateShort(s.recorded_at), weight: Number(s.weight_kg) }))

  const avatarName = watch('name')

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/app/dashboard')}
            className="text-gray-500 hover:text-gray-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-100">Mi perfil</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-800 rounded-xl" />
            <div className="h-64 bg-gray-800 rounded-xl" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                <span className="text-white text-2xl font-bold">
                  {avatarName ? avatarName[0].toUpperCase() : '?'}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-100">{avatarName || 'Sin nombre'}</p>
                <p className="text-sm text-gray-500">Edita tu perfil abajo</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
              <h2 className="font-semibold text-gray-100">Datos personales</h2>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Tu nombre"
                />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Fecha de nacimiento</label>
                <input
                  type="date"
                  {...register('birth_date')}
                  className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Altura (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    {...register('height_cm')}
                    className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="175"
                  />
                  {errors.height_cm && <p className="text-xs text-red-600 mt-1">{errors.height_cm.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    {...register('weight_kg')}
                    className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="70"
                  />
                  {errors.weight_kg && <p className="text-xs text-red-600 mt-1">{errors.weight_kg.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Objetivo</label>
                <select
                  {...register('goal')}
                  className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-900"
                >
                  <option value="">Sin objetivo</option>
                  {Object.entries(GOAL_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              {saveStatus && (
                <p className={`text-sm px-3 py-2 rounded-lg border ${
                  saveStatus.type === 'success'
                    ? 'text-green-700 bg-green-50 border-green-200'
                    : 'text-red-600 bg-red-50 border-red-200'
                }`}>
                  {saveStatus.msg}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar perfil'}
              </button>
            </form>

            {bmiInfo && (
              <div className={`border rounded-xl p-4 ${bmiInfo.color}`}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1">Índice de masa corporal</p>
                <p className="text-2xl font-bold">{bmi.toFixed(1)}</p>
                <p className="text-sm font-medium mt-0.5">{bmiInfo.label}</p>
              </div>
            )}

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
              <h2 className="font-semibold text-gray-100">Registrar peso</h2>

              <form onSubmit={handleAddStat} className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={statWeight}
                  onChange={(e) => setStatWeight(e.target.value)}
                  placeholder="kg"
                  className="w-24 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="date"
                  value={statDate}
                  onChange={(e) => setStatDate(e.target.value)}
                  className="flex-1 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-indigo-700 transition-colors shrink-0"
                >
                  Añadir
                </button>
              </form>

              {statError && <p className="text-xs text-red-600">{statError}</p>}

              {chartData.length > 1 && (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} width={40} />
                    <Tooltip />
                    <Line type="monotone" dataKey="weight" stroke="#111827" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {bodyStats.length > 0 ? (
                <ul className="space-y-1">
                  {bodyStats.slice(0, 10).map((s) => (
                    <li key={s.id} className="flex justify-between text-sm text-gray-300 py-1 border-b border-gray-800 last:border-0">
                      <span>{formatDate(s.recorded_at)}</span>
                      <span className="font-medium">{s.weight_kg} kg</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No hay registros de peso todavía.</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
