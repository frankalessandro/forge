import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Check, X, ChevronDown, Dumbbell } from 'lucide-react'
import { useWorkoutStore } from '../../../stores/workoutStore'
import { useWorkout } from '../../../hooks/useWorkout'
import ExercisePicker from '../../../components/features/ExercisePicker'

// ── Elapsed timer ──────────────────────────────────────────────────────────
function useElapsed(startedAt) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!startedAt) return
    const tick = () =>
      setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt])

  const h = Math.floor(elapsed / 3600)
  const m = Math.floor((elapsed % 3600) / 60)
  const s = elapsed % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ── Last performance badge ──────────────────────────────────────────────────
function LastPerf({ sets }) {
  if (!sets?.length) return null
  return (
    <div className="flex flex-wrap gap-1 mb-2">
      <span className="text-xs text-gray-400 mr-1">Última vez:</span>
      {sets.map((s, i) => (
        <span key={i} className="text-xs bg-blue-50 text-blue-700 rounded px-1.5 py-0.5">
          {s.weight_kg ?? 0} kg × {s.reps ?? 0}
        </span>
      ))}
    </div>
  )
}

// ── Set row ────────────────────────────────────────────────────────────────
function SetRow({ exId, setIndex, set, onUpdate, onComplete, onDelete }) {
  return (
    <div className={`flex items-center gap-2 py-1.5 ${set.completed ? 'opacity-60' : ''}`}>
      <span className="w-6 text-center text-xs font-medium text-gray-400 shrink-0">
        {setIndex + 1}
      </span>

      <input
        type="number"
        min="0"
        placeholder="kg"
        value={set.weight_kg ?? ''}
        onChange={(e) =>
          onUpdate(exId, setIndex, {
            weight_kg: e.target.value === '' ? null : Number(e.target.value),
          })
        }
        className="w-16 text-center text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-900"
      />

      <input
        type="number"
        min="0"
        placeholder="reps"
        value={set.reps ?? ''}
        onChange={(e) =>
          onUpdate(exId, setIndex, {
            reps: e.target.value === '' ? null : Number(e.target.value),
          })
        }
        className="w-16 text-center text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-900"
      />

      <div className="relative shrink-0">
        <select
          value={set.set_type}
          onChange={(e) => onUpdate(exId, setIndex, { set_type: e.target.value })}
          className="appearance-none text-xs border border-gray-300 rounded-lg pl-2 pr-6 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
        >
          <option value="normal">Normal</option>
          <option value="warmup">Calentamiento</option>
          <option value="dropset">Dropset</option>
          <option value="failure">Fallo</option>
        </select>
        <ChevronDown
          size={12}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
      </div>

      <button
        onClick={() => onComplete(exId, setIndex)}
        className={`ml-auto p-1.5 rounded-lg transition-colors shrink-0 ${
          set.completed
            ? 'bg-green-500 text-white'
            : 'border border-gray-300 text-gray-400 hover:border-green-500 hover:text-green-500'
        }`}
      >
        <Check size={14} />
      </button>

      <button
        onClick={() => onDelete(exId, setIndex)}
        className="p-1.5 text-gray-300 hover:text-red-500 transition-colors shrink-0"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

// ── Exercise card ──────────────────────────────────────────────────────────
function ExerciseCard({ exercise, lastPerf, onAddSet, onUpdateSet, onCompleteSet, onDeleteSet, onDeleteExercise }) {
  const lastSet = exercise.sets[exercise.sets.length - 1]

  const handleAddSet = () => {
    onAddSet(exercise.exerciseId, {
      reps: lastSet?.reps ?? null,
      weight_kg: lastSet?.weight_kg ?? null,
      set_type: lastSet?.set_type ?? 'normal',
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-start justify-between mb-1">
        <h3 className="font-semibold text-gray-900">{exercise.name}</h3>
        <button
          onClick={() => onDeleteExercise(exercise.exerciseId)}
          className="text-gray-300 hover:text-red-500 transition-colors p-1 -mr-1 -mt-1"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <LastPerf sets={lastPerf} />

      {exercise.sets.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center gap-2 py-1 text-xs text-gray-400 font-medium">
            <span className="w-6 text-center">#</span>
            <span className="w-16 text-center">kg</span>
            <span className="w-16 text-center">reps</span>
            <span>tipo</span>
          </div>
          {exercise.sets.map((set, i) => (
            <SetRow
              key={i}
              exId={exercise.exerciseId}
              setIndex={i}
              set={set}
              onUpdate={onUpdateSet}
              onComplete={onCompleteSet}
              onDelete={onDeleteSet}
            />
          ))}
        </div>
      )}

      <button
        onClick={handleAddSet}
        className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 border border-dashed border-gray-300 hover:border-gray-400 rounded-lg py-2 transition-colors mt-1"
      >
        <Plus size={14} />
        Agregar serie
      </button>
    </div>
  )
}

// ── Active workout page ────────────────────────────────────────────────────
export default function Active() {
  const navigate = useNavigate()
  const { session, exercises, isActive } = useWorkoutStore()
  const {
    addSet, updateSet, completeSet, deleteSet,
    deleteExercise, finishSession, cancelSession, getLastPerformance,
  } = useWorkout()

  const [showPicker, setShowPicker] = useState(false)
  const [lastPerfs, setLastPerfs] = useState({})
  const [notes, setNotes] = useState('')
  const [finishing, setFinishing] = useState(false)
  const [error, setError] = useState(null)
  const elapsed = useElapsed(session?.startedAt)

  // Redirect if no active session
  useEffect(() => {
    if (!isActive) navigate('/app/workout/start', { replace: true })
  }, [isActive, navigate])

  // Warn on browser close/refresh
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  const loadLastPerf = useCallback(async (exerciseId) => {
    if (lastPerfs[exerciseId] !== undefined) return
    setLastPerfs((p) => ({ ...p, [exerciseId]: null })) // mark as loading
    const data = await getLastPerformance(exerciseId)
    setLastPerfs((p) => ({ ...p, [exerciseId]: data }))
  }, [lastPerfs, getLastPerformance])

  useEffect(() => {
    exercises.forEach((ex) => {
      if (lastPerfs[ex.exerciseId] === undefined) loadLastPerf(ex.exerciseId)
    })
  }) // run every render but loadLastPerf is gated by undefined check

  const handlePickExercise = (exercise) => {
    useWorkoutStore.getState().addExercise(exercise)
    setShowPicker(false)
    loadLastPerf(exercise.id)
  }

  const wrap = (fn) => async (...args) => {
    try { await fn(...args) } catch (err) { setError(err.message) }
  }

  const handleFinish = async () => {
    try {
      setFinishing(true)
      const sessionId = await finishSession(notes || null)
      navigate(`/app/workout/summary/${sessionId}`, { replace: true })
    } catch (err) {
      setError(err.message)
      setFinishing(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('¿Cancelar el entrenamiento? Se perderán todos los datos.')) return
    await cancelSession()
    navigate('/app/dashboard', { replace: true })
  }

  if (!isActive) return null

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Sticky header with timer */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
              Entrenamiento activo
            </p>
            <p className="text-2xl font-mono font-bold text-gray-900 tabular-nums">{elapsed}</p>
          </div>
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            <X size={16} />
            Cancelar
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-6 space-y-4">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {exercises.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Dumbbell size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="font-medium text-gray-500">Sin ejercicios todavía</p>
            <p className="text-sm mt-1">Tocá "Agregar ejercicio" para comenzar</p>
          </div>
        )}

        {exercises.map((ex) => (
          <ExerciseCard
            key={ex.exerciseId}
            exercise={ex}
            lastPerf={lastPerfs[ex.exerciseId]}
            onAddSet={wrap(addSet)}
            onUpdateSet={wrap(updateSet)}
            onCompleteSet={wrap(completeSet)}
            onDeleteSet={wrap(deleteSet)}
            onDeleteExercise={wrap(deleteExercise)}
          />
        ))}

        {/* Notes */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Notas del entrenamiento
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="¿Cómo te sentiste? ¿Algo a mejorar?"
            rows={3}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-900 resize-none"
          />
        </div>
      </main>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-10">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 rounded-xl px-4 py-3 text-sm font-medium hover:border-gray-400 transition-colors shrink-0"
          >
            <Plus size={16} />
            Agregar ejercicio
          </button>
          <button
            onClick={handleFinish}
            disabled={finishing}
            className="flex-1 bg-gray-900 text-white rounded-xl py-3 text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-60"
          >
            {finishing ? 'Guardando...' : 'Finalizar entrenamiento'}
          </button>
        </div>
      </div>

      {showPicker && (
        <ExercisePicker
          onSelect={handlePickExercise}
          onClose={() => setShowPicker(false)}
          excludeIds={exercises.map((ex) => ex.exerciseId)}
        />
      )}
    </div>
  )
}
