import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Check, X, ChevronDown, Dumbbell, SkipForward, Timer } from 'lucide-react'
import { useWorkoutStore } from '../../../stores/workoutStore'
import { useWorkout } from '../../../hooks/useWorkout'
import { useRestTimer } from '../../../hooks/useRestTimer'
import ExercisePicker from '../../../components/features/ExercisePicker'

// ── Helpers ────────────────────────────────────────────────────────────────
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

function calcStats(exercises) {
  let completedSets = 0
  let volume = 0
  for (const ex of exercises) {
    for (const s of ex.sets) {
      if (s.completed) {
        completedSets++
        if (s.set_type !== 'warmup') {
          volume += (s.reps ?? 0) * (s.weight_kg ?? 0)
        }
      }
    }
  }
  return { completedSets, volume }
}

const SET_TYPE_STYLES = {
  normal:  { row: '', badge: '' },
  warmup:  { row: 'bg-amber-50',  badge: 'bg-amber-100 text-amber-700' },
  dropset: { row: 'bg-purple-50', badge: 'bg-purple-100 text-purple-700' },
  failure: { row: 'bg-red-50',    badge: 'bg-red-100 text-red-700' },
}

const SET_TYPE_LABELS = {
  normal: 'N', warmup: 'C', dropset: 'D', failure: 'F',
}

// ── Rest timer bar ─────────────────────────────────────────────────────────
function RestTimerBar({ remaining, duration, onSkip, onAdd30 }) {
  const pct = duration > 0 ? Math.max(0, (remaining / duration) * 100) : 0
  const m = Math.floor(remaining / 60)
  const s = remaining % 60
  const label = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`

  return (
    <div className="bg-gray-900 border-b border-gray-800 text-white px-6 py-2">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-1.5">
          <Timer size={14} className="text-gray-500 shrink-0" />
          <span className="text-xs text-gray-500 flex-1">Descanso</span>
          <span className="font-mono font-bold tabular-nums text-sm">{label}</span>
          <button
            onClick={onAdd30}
            className="text-xs text-gray-500 hover:text-white transition-colors px-1"
          >
            +30s
          </button>
          <button
            onClick={onSkip}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors"
          >
            <SkipForward size={13} />
            Saltar
          </button>
        </div>
        <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-400 rounded-full transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ── Last performance ───────────────────────────────────────────────────────
function LastPerf({ sets }) {
  if (!sets?.length) return null
  return (
    <div className="flex flex-wrap gap-1 mb-2">
      <span className="text-xs text-gray-500 mr-1">Última vez:</span>
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
  const styles = SET_TYPE_STYLES[set.set_type] ?? SET_TYPE_STYLES.normal

  return (
    <div className={`flex items-center gap-2 py-1.5 rounded-lg px-1 ${styles.row} ${set.completed ? 'opacity-60' : ''}`}>
      <span className="w-5 text-center text-xs font-medium text-gray-500 shrink-0">
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
        className="w-16 text-center text-sm border border-gray-700 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-900"
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
        className="w-16 text-center text-sm border border-gray-700 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-900"
      />

      {/* Compact set-type toggle */}
      <div className="relative shrink-0">
        <select
          value={set.set_type}
          onChange={(e) => onUpdate(exId, setIndex, { set_type: e.target.value })}
          className={`appearance-none text-xs font-semibold rounded-lg pl-2 pr-5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 border-0 cursor-pointer ${styles.badge || 'bg-gray-800 text-gray-400'}`}
        >
          <option value="normal">Normal</option>
          <option value="warmup">Calent.</option>
          <option value="dropset">Dropset</option>
          <option value="failure">Fallo</option>
        </select>
        <ChevronDown
          size={11}
          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-60 pointer-events-none"
        />
      </div>

      <button
        onClick={() => onComplete(exId, setIndex)}
        className={`ml-auto p-1.5 rounded-lg transition-colors shrink-0 ${
          set.completed
            ? 'bg-green-500 text-white'
            : 'border border-gray-700 text-gray-500 hover:border-green-500 hover:text-green-500'
        }`}
      >
        <Check size={14} />
      </button>

      <button
        onClick={() => onDelete(exId, setIndex)}
        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors shrink-0"
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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-start justify-between mb-1">
        <h3 className="font-semibold text-gray-100">{exercise.name}</h3>
        <button
          onClick={() => onDeleteExercise(exercise.exerciseId)}
          className="text-gray-400 hover:text-red-500 transition-colors p-1 -mr-1 -mt-1"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <LastPerf sets={lastPerf} />

      {exercise.sets.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center gap-2 py-1 px-1 text-xs text-gray-500 font-medium">
            <span className="w-5 text-center">#</span>
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
        className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-100 border border-dashed border-gray-700 hover:border-gray-600 rounded-lg py-2 transition-colors mt-1"
      >
        <Plus size={14} />
        Agregar serie
      </button>
    </div>
  )
}

// ── Live stats bar ─────────────────────────────────────────────────────────
function StatsBar({ exercises, elapsed }) {
  const { completedSets, volume } = calcStats(exercises)
  return (
    <div className="bg-gray-950 border-b border-gray-800 px-6 py-2">
      <div className="max-w-2xl mx-auto flex gap-6 text-center">
        <div className="flex-1">
          <p className="text-lg font-bold text-gray-100 tabular-nums">{elapsed}</p>
          <p className="text-xs text-gray-500">tiempo</p>
        </div>
        <div className="flex-1">
          <p className="text-lg font-bold text-gray-100">{completedSets}</p>
          <p className="text-xs text-gray-500">series</p>
        </div>
        <div className="flex-1">
          <p className="text-lg font-bold text-gray-100">
            {volume > 0 ? `${volume.toLocaleString('es-AR')} kg` : '—'}
          </p>
          <p className="text-xs text-gray-500">volumen</p>
        </div>
      </div>
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
  const restTimer = useRestTimer()

  const [showPicker, setShowPicker] = useState(false)
  const [lastPerfs, setLastPerfs] = useState({})
  const [notes, setNotes] = useState('')
  const [finishing, setFinishing] = useState(false)
  const [error, setError] = useState(null)
  const elapsed = useElapsed(session?.startedAt)

  useEffect(() => {
    if (!isActive) navigate('/app/workout/start', { replace: true })
  }, [isActive, navigate])

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  const loadLastPerf = useCallback(async (exerciseId) => {
    if (lastPerfs[exerciseId] !== undefined) return
    setLastPerfs((p) => ({ ...p, [exerciseId]: null }))
    const data = await getLastPerformance(exerciseId)
    setLastPerfs((p) => ({ ...p, [exerciseId]: data }))
  }, [lastPerfs, getLastPerformance])

  useEffect(() => {
    exercises.forEach((ex) => {
      if (lastPerfs[ex.exerciseId] === undefined) loadLastPerf(ex.exerciseId)
    })
  })

  const handlePickExercise = (exercise) => {
    useWorkoutStore.getState().addExercise(exercise)
    setShowPicker(false)
    loadLastPerf(exercise.id)
  }

  const handleCompleteSet = useCallback(async (exerciseId, setIndex) => {
    try {
      await completeSet(exerciseId, setIndex)
      // Only start rest timer when marking complete (not uncomplete)
      const set = useWorkoutStore.getState().exercises
        .find((ex) => ex.exerciseId === exerciseId)?.sets[setIndex]
      if (set?.completed) restTimer.start()
    } catch (err) {
      setError(err.message)
    }
  }, [completeSet, restTimer])

  const wrap = (fn) => async (...args) => {
    try { await fn(...args) } catch (err) { setError(err.message) }
  }

  const handleFinish = async () => {
    try {
      setFinishing(true)
      restTimer.skip()
      const sessionId = await finishSession(notes || null)
      navigate(`/app/workout/summary/${sessionId}`, { replace: true })
    } catch (err) {
      setError(err.message)
      setFinishing(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('¿Cancelar el entrenamiento? Se perderán todos los datos.')) return
    restTimer.skip()
    await cancelSession()
    navigate('/app/dashboard', { replace: true })
  }

  if (!isActive) return null

  return (
    <div className="min-h-screen bg-gray-950 pb-28">
      {/* Sticky header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <p className="text-base font-bold text-gray-100">Entrenamiento activo</p>
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            <X size={16} />
            Cancelar
          </button>
        </div>
      </header>

      {/* Rest timer bar — shown when timer is running */}
      {restTimer.isRunning && (
        <RestTimerBar
          remaining={restTimer.remaining}
          duration={restTimer.duration}
          onSkip={restTimer.skip}
          onAdd30={() => restTimer.addTime(30)}
        />
      )}

      {/* Live stats bar */}
      <StatsBar exercises={exercises} elapsed={elapsed} />

      <main className="max-w-2xl mx-auto px-6 py-6 space-y-4">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {exercises.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <Dumbbell size={40} className="mx-auto mb-3 text-gray-500" />
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
            onCompleteSet={handleCompleteSet}
            onDeleteSet={wrap(deleteSet)}
            onDeleteExercise={wrap(deleteExercise)}
          />
        ))}

        {/* Notes */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <label className="text-sm font-medium text-gray-300 block mb-2">
            Notas del entrenamiento
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="¿Cómo te sentiste? ¿Algo a mejorar?"
            rows={3}
            className="w-full text-sm border border-gray-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
          />
        </div>
      </main>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-6 py-4 z-10">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-2 border border-gray-700 text-gray-300 rounded-xl px-4 py-3 text-sm font-medium hover:border-gray-600 transition-colors shrink-0"
          >
            <Plus size={16} />
            Agregar ejercicio
          </button>
          <button
            onClick={handleFinish}
            disabled={finishing}
            className="flex-1 bg-indigo-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
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
