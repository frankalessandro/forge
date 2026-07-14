import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camera, Check } from 'lucide-react'
import { sileo } from 'sileo'
import { useProfile } from '../../hooks/useProfile'
import PageHeader from '../../components/ui/PageHeader'
import { GENDERS, ACTIVITY_LEVELS } from '../../utils/healthMetrics'
import { GOALS, TRAINING_DAYS, MAX_GOALS } from '../../utils/routineTemplates'
import { logError } from '../../utils/logError'

const profileSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').optional().or(z.literal('')),
  bio: z.string().max(160, 'Máximo 160 caracteres').optional().or(z.literal('')),
  birth_date: z.string().optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other', '']).optional(),
  height_cm: z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().positive().optional()),
  activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active', '']).optional(),
  training_days_per_week: z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().int().min(0).max(7).optional(),
  ),
})


export default function ProfileEdit() {
  const navigate = useNavigate()
  const { getProfile, updateProfile, uploadAvatar } = useProfile()

  const [loading, setLoading] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [goals, setGoals] = useState([])
  const avatarInputRef = useRef(null)

  const toggleGoal = (value) =>
    setGoals((prev) => {
      if (prev.includes(value)) return prev.filter((g) => g !== value)
      if (prev.length >= MAX_GOALS) return prev
      return [...prev, value]
    })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(profileSchema) })

  useEffect(() => {
    async function load() {
      const { data, error } = await getProfile()
      if (error) logError('ProfileEdit.load', error)
      if (data) {
        reset({
          name: data.name ?? '',
          bio: data.bio ?? '',
          birth_date: data.birth_date ?? '',
          gender: data.gender ?? '',
          height_cm: data.height_cm ?? '',
          activity_level: data.activity_level ?? '',
          training_days_per_week: data.training_days_per_week ?? '',
        })
        setGoals(data.goals ?? (data.goal ? [data.goal] : []))
        setAvatarUrl(data.avatar_url ?? null)
      }
      setLoading(false)
    }
    load()
  }, [getProfile, reset])

  async function onSubmit(values) {
    const clean = {}
    if (values.name !== undefined && values.name !== '') clean.name = values.name
    clean.bio = values.bio ?? ''
    if (values.birth_date !== undefined && values.birth_date !== '') clean.birth_date = values.birth_date
    if (values.gender !== undefined && values.gender !== '') clean.gender = values.gender
    if (values.height_cm !== undefined) clean.height_cm = values.height_cm
    if (values.activity_level !== undefined && values.activity_level !== '') clean.activity_level = values.activity_level
    if (values.training_days_per_week !== undefined) clean.training_days_per_week = values.training_days_per_week
    // Objetivos: array completo + `goal` principal (goals[0]) por compatibilidad.
    clean.goals = goals.length ? goals : null
    clean.goal = goals[0] ?? null

    const { error } = await updateProfile(clean)
    if (error) {
      logError('ProfileEdit.onSubmit', error)
      sileo.error({ title: 'Error al guardar', description: error.message })
    } else {
      sileo.success({ title: 'Perfil guardado correctamente.' })
      navigate('/app/profile')
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    const { data, error } = await uploadAvatar(file)
    if (error) {
      logError('ProfileEdit.handleAvatarChange', error)
      sileo.error({ title: 'Error al subir la foto', description: error.message })
    } else {
      setAvatarUrl(data?.avatar_url ?? avatarUrl)
      sileo.success({ title: 'Foto actualizada.' })
    }
    setUploadingAvatar(false)
    e.target.value = ''
  }

  // watch() de React Hook Form no es memoizable por el React Compiler (API externa);
  // el valor se usa solo para previsualizar, sin pasarse a componentes memoizados.
  // eslint-disable-next-line react-hooks/incompatible-library
  const avatarName = watch('name')
  const bioValue = watch('bio') ?? ''

  return (
    <div className="min-h-screen bg-ink-950">
      <PageHeader title="Editar perfil" back="/app/profile" />

      <main className="max-w-2xl mx-auto px-5 py-6">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-24 card" />
            <div className="h-64 card" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Foto de perfil */}
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="relative w-24 h-24 rounded-3xl group overflow-hidden"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-accent flex items-center justify-center">
                    <span className="text-ink-950 text-3xl font-display font-bold">
                      {avatarName ? avatarName[0].toUpperCase() : '?'}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingAvatar
                    ? <span className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    : <Camera size={22} className="text-white" />
                  }
                </div>
              </button>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="text-xs text-zinc-500 hover:text-accent transition-colors"
              >
                Cambiar foto
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="card p-5 space-y-4">
              <div>
                <label className="field-label">Nombre</label>
                <input type="text" {...register('name')} className="input" placeholder="Tu nombre" />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="field-label">Descripción</label>
                <textarea
                  {...register('bio')}
                  rows={2}
                  maxLength={160}
                  className="input resize-none"
                  placeholder="Cuéntale a tus amigos quién eres"
                />
                {errors.bio
                  ? <p className="text-xs text-red-400 mt-1">{errors.bio.message}</p>
                  : <p className="text-xs text-zinc-600 mt-1 text-right">{bioValue.length}/160</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Género</label>
                  <select {...register('gender')} className="input">
                    <option value="">Sin especificar</option>
                    {GENDERS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label">Nivel de actividad</label>
                  <select {...register('activity_level')} className="input">
                    <option value="">Sin especificar</option>
                    {ACTIVITY_LEVELS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Fecha de nacimiento</label>
                  <input type="date" {...register('birth_date')} className="input" />
                </div>
                <div>
                  <label className="field-label">Altura (cm)</label>
                  <input type="number" step="0.1" {...register('height_cm')} className="input" placeholder="175" />
                  {errors.height_cm && <p className="text-xs text-red-400 mt-1">{errors.height_cm.message}</p>}
                </div>
              </div>

              <div>
                <label className="field-label">Días de entreno / semana</label>
                <select {...register('training_days_per_week')} className="input">
                  <option value="">Sin especificar</option>
                  {TRAINING_DAYS.map((n) => (
                    <option key={n} value={n}>{n === 7 ? '7 (todos los días)' : `${n} días`}</option>
                  ))}
                </select>
                {errors.training_days_per_week
                  ? <p className="text-xs text-red-400 mt-1">{errors.training_days_per_week.message}</p>
                  : <p className="text-xs text-zinc-600 mt-1">Tu meta para mantener la racha.</p>}
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <label className="field-label">Objetivos</label>
                  <span className="text-xs text-zinc-600">{goals.length}/{MAX_GOALS}</span>
                </div>
                <p className="text-xs text-zinc-600 mb-2">Elige hasta 3. El primero define tus rutinas generadas.</p>
                <div className="space-y-2.5">
                  {GOALS.map(({ value, label, icon: Icon }) => {
                    const active = goals.includes(value)
                    const disabled = !active && goals.length >= MAX_GOALS
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
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => navigate('/app/profile')} className="btn-dark flex-1 py-3 text-sm">
                Cancelar
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-accent flex-1 py-3 text-sm">
                {isSubmitting ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}
