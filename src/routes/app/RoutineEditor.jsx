import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical } from 'lucide-react'
import { useRoutines } from '../../hooks/useRoutines'
import ExercisePicker from '../../components/features/ExercisePicker'
import PageHeader from '../../components/ui/PageHeader'
import { TAG_COLORS } from '../../utils/tagColors'

const metaSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido').max(80, 'Máximo 80 caracteres'),
  description: z.string().trim().max(280, 'Máximo 280 caracteres').optional().or(z.literal('')),
  category: z.string().trim().max(24, 'Máximo 24 caracteres').optional().or(z.literal('')),
})

const itemSchema = z.object({
  exercise_id: z.string(),
  sets: z.number().int('Series debe ser un número entero').min(1, 'Series debe ser al menos 1').max(20, 'Máximo 20 series'),
  reps: z.number().int('Reps debe ser un número entero').min(1, 'Reps debe ser al menos 1').max(100, 'Máximo 100 reps'),
  rest_seconds: z.number().int('El descanso debe ser un número entero').min(0, 'El descanso no puede ser negativo').max(600, 'Máximo 600 segundos'),
})

function NumberField({ label, value, min, max, onChange }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="eyebrow">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        className="input text-center px-2 py-2"
      />
    </label>
  )
}

function ExerciseRow({ item, index, total, onChange, onMove, onRemove }) {
  return (
    <div className="card p-4">
      <div className="flex items-start gap-3 mb-3">
        <GripVertical size={16} className="text-zinc-700 mt-1 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="display text-sm text-zinc-100 truncate">{item.name}</p>
          {item.muscle && <p className="text-xs text-zinc-500">{item.muscle}</p>}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={() => onMove(index, index - 1)} disabled={index === 0} className="p-1 text-zinc-500 hover:text-zinc-100 disabled:opacity-30 transition-colors">
            <ChevronUp size={16} />
          </button>
          <button onClick={() => onMove(index, index + 1)} disabled={index === total - 1} className="p-1 text-zinc-500 hover:text-zinc-100 disabled:opacity-30 transition-colors">
            <ChevronDown size={16} />
          </button>
          <button onClick={() => onRemove(index)} className="p-1 text-zinc-500 hover:text-red-400 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 pl-7">
        <NumberField label="Series" value={item.sets} min={1} max={20} onChange={(v) => onChange(index, { sets: v })} />
        <NumberField label="Reps" value={item.reps} min={1} max={100} onChange={(v) => onChange(index, { reps: v })} />
        <NumberField label="Desc. (s)" value={item.rest_seconds} min={0} max={600} onChange={(v) => onChange(index, { rest_seconds: v })} />
      </div>
    </div>
  )
}

export default function RoutineEditor() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { getRoutineDetail, createRoutine, updateRoutine, replaceRoutineExercises } = useRoutines()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [categoryColor, setCategoryColor] = useState('')
  const [items, setItems] = useState([])

  const [loading, setLoading] = useState(isEdit)
  const [showPicker, setShowPicker] = useState(false)
  const [errors, setErrors] = useState({})
  const [saveError, setSaveError] = useState(null)
  const [saving, setSaving] = useState(false)
  // Si createRoutine tiene éxito pero replaceRoutineExercises falla después,
  // guardamos el id ya creado para que un reintento actualice esa rutina en
  // vez de crear una duplicada.
  const [createdRoutineId, setCreatedRoutineId] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    async function load() {
      try {
        const data = await getRoutineDetail(id)
        if (cancelled) return
        setName(data.name ?? '')
        setDescription(data.description ?? '')
        setCategory(data.category ?? '')
        setCategoryColor(data.category_color ?? '')
        setItems(
          data.routine_exercises.map((re) => ({
            exercise_id: re.exercise_id,
            name: re.exercises?.name ?? 'Ejercicio',
            muscle: re.exercises?.muscle_groups?.name ?? '',
            sets: re.sets ?? 3,
            reps: re.reps ?? 10,
            rest_seconds: re.rest_seconds ?? 90,
          }))
        )
      } catch (err) {
        if (!cancelled) setSaveError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id, isEdit, getRoutineDetail])

  const handleAddExercise = (exercise) => {
    setShowPicker(false)
    setItems((prev) => [
      ...prev,
      {
        exercise_id: exercise.id,
        name: exercise.name,
        muscle: exercise.muscle_groups?.name ?? '',
        sets: 3,
        reps: 10,
        rest_seconds: 90,
      },
    ])
  }

  const handleChangeItem = (index, patch) =>
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)))

  const handleMove = (from, to) => {
    if (to < 0 || to >= items.length) return
    setItems((prev) => {
      const list = [...prev]
      const [moved] = list.splice(from, 1)
      list.splice(to, 0, moved)
      return list
    })
  }

  const handleRemove = (index) => setItems((prev) => prev.filter((_, i) => i !== index))

  const handleSave = async () => {
    setSaveError(null)
    const result = metaSchema.safeParse({ name, description, category })
    if (!result.success) {
      const fieldErrors = {}
      for (const issue of result.error.issues) fieldErrors[issue.path[0]] = issue.message
      setErrors(fieldErrors)
      return
    }
    setErrors({})

    if (items.length === 0) {
      setSaveError('Agrega al menos un ejercicio a la rutina.')
      return
    }

    const itemsResult = z.array(itemSchema).safeParse(
      items.map((it) => ({
        exercise_id: it.exercise_id,
        sets: it.sets === '' ? 3 : it.sets,
        reps: it.reps === '' ? 10 : it.reps,
        rest_seconds: it.rest_seconds === '' ? 90 : it.rest_seconds,
      }))
    )
    if (!itemsResult.success) {
      setSaveError(itemsResult.error.issues[0]?.message ?? 'Revisa los valores de series, reps y descanso.')
      return
    }
    setErrors({})

    const cleanItems = itemsResult.data

    try {
      setSaving(true)
      const trimmedCategory = category.trim()
      const payload = {
        name: name.trim(),
        description,
        category: trimmedCategory,
        category_color: trimmedCategory ? categoryColor || 'lime' : '',
      }
      const existingId = isEdit ? id : createdRoutineId
      let routineId = existingId
      if (existingId) {
        await updateRoutine(existingId, payload)
      } else {
        routineId = await createRoutine(payload)
        setCreatedRoutineId(routineId)
      }
      await replaceRoutineExercises(routineId, cleanItems)
      navigate(`/app/routines/${routineId}`, { replace: true })
    } catch (err) {
      setSaveError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink-950">
      <PageHeader title={isEdit ? 'Editar rutina' : 'Nueva rutina'} back={isEdit ? `/app/routines/${id}` : '/app/routines'} />

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-6 pb-[calc(var(--nav-h)+6rem)]">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-40 card" />
            <div className="h-20 card" />
          </div>
        ) : (
          <>
            <div className="card p-5 space-y-4">
              <div>
                <label className="field-label">Nombre</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Mi Push de los lunes" className="input" />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="field-label">Descripción</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opcional" rows={2} className="input resize-none" />
                {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description}</p>}
              </div>
              <div>
                <label className="field-label">Tag (opcional)</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ej. Empuje, Día 1, Fuerza…"
                  maxLength={24}
                  className="input"
                />
                {errors.category && <p className="text-xs text-red-400 mt-1">{errors.category}</p>}
                {category.trim() && (
                  <div className="flex gap-2 mt-2.5 flex-wrap">
                    {TAG_COLORS.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setCategoryColor(c.key)}
                        aria-label={c.label}
                        className={`w-7 h-7 rounded-full ${c.dot} transition-shadow ${
                          (categoryColor || 'lime') === c.key ? 'ring-2 ring-offset-2 ring-offset-ink-900 ring-zinc-100' : ''
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <section className="space-y-3">
              <h2 className="section-title">Ejercicios ({items.length})</h2>

              {items.length === 0 ? (
                <div className="card border-dashed px-6 py-8 text-center">
                  <p className="text-sm text-zinc-500">Aún no has agregado ejercicios</p>
                </div>
              ) : (
                items.map((item, i) => (
                  <ExerciseRow
                    key={`${item.exercise_id}-${i}`}
                    item={item}
                    index={i}
                    total={items.length}
                    onChange={handleChangeItem}
                    onMove={handleMove}
                    onRemove={handleRemove}
                  />
                ))
              )}

              <button
                onClick={() => setShowPicker(true)}
                className="w-full flex items-center justify-center gap-1.5 text-sm text-zinc-400 hover:text-accent border border-dashed border-ink-700 hover:border-accent/40 rounded-2xl py-3 transition-colors"
              >
                <Plus size={16} />
                Agregar ejercicio
              </button>
            </section>

            {saveError && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{saveError}</p>
            )}
          </>
        )}
      </main>

      {!loading && (
        <div className="fixed bottom-[var(--nav-h)] inset-x-0 z-30 bg-ink-950/90 backdrop-blur-md border-t border-ink-800 px-5 py-4">
          <div className="max-w-2xl mx-auto">
            <button onClick={handleSave} disabled={saving} className="btn-accent w-full py-3.5 text-sm">
              {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear rutina'}
            </button>
          </div>
        </div>
      )}

      {showPicker && <ExercisePicker onSelect={handleAddExercise} onClose={() => setShowPicker(false)} />}
    </div>
  )
}
