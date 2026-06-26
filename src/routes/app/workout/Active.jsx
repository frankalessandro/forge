import { useState, useEffect, useCallback, useRef, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Check, X, ChevronDown, Dumbbell, SkipForward, Timer } from 'lucide-react'
import { useWorkoutStore } from '../../../stores/workoutStore'
import { useWorkout } from '../../../hooks/useWorkout'
import { useRestTimer } from '../../../hooks/useRestTimer'
import { useAchievements } from '../../../hooks/useAchievements'
import { sileo } from 'sileo'
import { iconFor } from '../../../utils/achievementIcons'
import ExercisePicker from '../../../components/features/ExercisePicker'

const PERSIST_DELAY = 600

// ── Helpers ────────────────────────────────────────────────────────────────
function useElapsed(startedAt) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!startedAt) return
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
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
        if (s.set_type !== 'warmup') volume += (s.reps ?? 0) * (s.weight_kg ?? 0)
      }
    }
  }
  return { completedSets, volume }
}

const SET_TYPE_STYLES = {
  normal: { row: '', badge: 'bg-ink-800 text-zinc-400' },
  warmup: { row: 'bg-amber-400/5', badge: 'bg-amber-400/15 text-amber-300' },
  dropset: { row: 'bg-fuchsia-400/5', badge: 'bg-fuchsia-400/15 text-fuchsia-300' },
  failure: { row: 'bg-red-400/5', badge: 'bg-red-400/15 text-red-300' },
}

// ── Rest timer bar ─────────────────────────────────────────────────────────
function RestTimerBar({ remaining, duration, onSkip, onAdd30 }) {
  const pct = duration > 0 ? Math.max(0, (remaining / duration) * 100) : 0
  const m = Math.floor(remaining / 60)
  const s = remaining % 60
  const label = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`

  return (
    <div className="bg-ink-900 border-b border-ink-800 px-5 py-2.5">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-1.5">
          <Timer size={14} className="text-accent shrink-0" />
          <span className="eyebrow flex-1">Descanso</span>
          <span className="stat-num text-base text-zinc-100">{label}</span>
          <button onClick={onAdd30} className="text-xs text-zinc-500 hover:text-zinc-100 transition-colors px-1">
            +30s
          </button>
          <button onClick={onSkip} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-100 transition-colors">
            <SkipForward size={13} />
            Saltar
          </button>
        </div>
        <div className="h-1 bg-ink-800 rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}

// ── Last performance ───────────────────────────────────────────────────────
function LastPerf({ sets }) {
  if (!sets?.length) return null
  return (
    <div className="flex flex-wrap gap-1 mb-2.5">
      <span className="eyebrow mr-1 self-center">Última vez</span>
      {sets.map((s, i) => (
        <span key={i} className="text-xs font-medium bg-ink-800 text-zinc-300 rounded-md px-1.5 py-0.5 tabular-nums">
          {s.weight_kg ?? 0}×{s.reps ?? 0}
        </span>
      ))}
    </div>
  )
}

// ── Set row (memoizado: solo re-renderiza si cambia su propia serie) ─────────
const SetRow = memo(function SetRow({ exId, setIndex, set, onWeight, onReps, onType, onComplete, onDelete }) {
  const styles = SET_TYPE_STYLES[set.set_type] ?? SET_TYPE_STYLES.normal

  return (
    <div className={`flex items-center gap-1.5 py-1.5 rounded-lg px-1 ${styles.row} ${set.completed ? 'opacity-50' : ''}`}>
      <span className="w-5 text-center stat-num text-sm text-zinc-500 shrink-0">{setIndex + 1}</span>

      <input
        type="number"
        inputMode="decimal"
        min="0"
        placeholder="kg"
        value={set.weight_kg ?? ''}
        onChange={(e) => onWeight(exId, setIndex, e.target.value === '' ? null : Number(e.target.value))}
        className="flex-1 min-w-0 w-0 text-center text-sm tabular-nums bg-ink-850 border border-ink-700 rounded-lg px-1.5 py-1.5 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
      />
      <input
        type="number"
        inputMode="numeric"
        min="0"
        placeholder="reps"
        value={set.reps ?? ''}
        onChange={(e) => onReps(exId, setIndex, e.target.value === '' ? null : Number(e.target.value))}
        className="flex-1 min-w-0 w-0 text-center text-sm tabular-nums bg-ink-850 border border-ink-700 rounded-lg px-1.5 py-1.5 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
      />

      <div className="relative shrink-0">
        <select
          value={set.set_type}
          onChange={(e) => onType(exId, setIndex, e.target.value)}
          className={`appearance-none text-xs font-display font-semibold uppercase tracking-wide rounded-lg pl-2 pr-5 py-1.5 focus:outline-none border-0 cursor-pointer ${styles.badge}`}
        >
          <option value="normal">Normal</option>
          <option value="warmup">Calent.</option>
          <option value="dropset">Dropset</option>
          <option value="failure">Fallo</option>
        </select>
        <ChevronDown size={11} className="absolute right-1 top-1/2 -translate-y-1/2 opacity-60 pointer-events-none" />
      </div>

      <button
        onClick={() => onComplete(exId, setIndex)}
        className={`p-1.5 rounded-lg transition-colors shrink-0 ${
          set.completed
            ? 'bg-accent text-ink-950'
            : 'border border-ink-700 text-zinc-500 hover:border-accent hover:text-accent'
        }`}
      >
        <Check size={14} strokeWidth={3} />
      </button>

      <button onClick={() => onDelete(exId, setIndex)} className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors shrink-0">
        <Trash2 size={14} />
      </button>
    </div>
  )
})

// ── Exercise card (memoizado por ejercicio) ─────────────────────────────────
const ExerciseCard = memo(function ExerciseCard({
  exercise, lastPerf, onAddSet, onWeight, onReps, onType, onComplete, onDeleteSet, onDeleteExercise,
}) {
  const lastSet = exercise.sets[exercise.sets.length - 1]
  const handleAddSet = () =>
    onAddSet(exercise.exerciseId, {
      reps: lastSet?.reps ?? null,
      weight_kg: lastSet?.weight_kg ?? null,
      set_type: lastSet?.set_type ?? 'normal',
    })

  return (
    <div className="card p-4">
      <div className="flex items-start gap-2 mb-3">
        <h3 className="display text-sm text-zinc-100 flex-1 min-w-0">{exercise.name}</h3>
        <button onClick={() => onDeleteExercise(exercise.exerciseId)} className="text-zinc-600 hover:text-red-400 transition-colors p-1 -mr-1 -mt-1">
          <Trash2 size={16} />
        </button>
      </div>

      {/* Espacio para la imagen del ejercicio (placeholder si aún no hay) */}
      {exercise.imageUrl ? (
        <img
          src={exercise.imageUrl}
          alt={exercise.name}
          className="w-full h-40 object-contain bg-black rounded-xl border border-ink-800 mb-3"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-40 rounded-xl border border-dashed border-ink-700 bg-ink-850/40 mb-3 flex flex-col items-center justify-center gap-1.5 text-zinc-700">
          <Dumbbell size={28} strokeWidth={1.5} />
          <span className="text-xs">Imagen del ejercicio</span>
        </div>
      )}

      <LastPerf sets={lastPerf} />

      {exercise.sets.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center gap-1.5 py-1 px-1 eyebrow">
            <span className="w-5 text-center shrink-0">#</span>
            <span className="flex-1 min-w-0 text-center">kg</span>
            <span className="flex-1 min-w-0 text-center">reps</span>
            <span className="shrink-0">tipo</span>
          </div>
          {exercise.sets.map((set, i) => (
            <SetRow
              key={set.dbId ?? i}
              exId={exercise.exerciseId}
              setIndex={i}
              set={set}
              onWeight={onWeight}
              onReps={onReps}
              onType={onType}
              onComplete={onComplete}
              onDelete={onDeleteSet}
            />
          ))}
        </div>
      )}

      <button
        onClick={handleAddSet}
        className="w-full flex items-center justify-center gap-1.5 text-sm text-zinc-500 hover:text-accent border border-dashed border-ink-700 hover:border-accent/40 rounded-lg py-2 transition-colors mt-1"
      >
        <Plus size={14} />
        Agregar serie
      </button>
    </div>
  )
})

// ── Live stats bar ─────────────────────────────────────────────────────────
function StatsBar({ exercises, elapsed }) {
  const { completedSets, volume } = calcStats(exercises)
  return (
    <div className="bg-ink-950 border-b border-ink-800 px-5 py-2.5">
      <div className="max-w-2xl mx-auto grid grid-cols-3 text-center divide-x divide-ink-800">
        <div>
          <p className="stat-num text-xl text-accent">{elapsed}</p>
          <p className="eyebrow mt-0.5">tiempo</p>
        </div>
        <div>
          <p className="stat-num text-xl text-zinc-100">{completedSets}</p>
          <p className="eyebrow mt-0.5">series</p>
        </div>
        <div>
          <p className="stat-num text-xl text-zinc-100">{volume > 0 ? volume.toLocaleString('es') : '—'}</p>
          <p className="eyebrow mt-0.5">kg vol</p>
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
    addSet, syncExerciseSets, completeSet, deleteSet,
    deleteExercise, finishSession, cancelSession, getLastPerformance,
  } = useWorkout()
  const restTimer = useRestTimer()
  const { checkAndUnlock } = useAchievements()

  const [showPicker, setShowPicker] = useState(false)
  const [lastPerfs, setLastPerfs] = useState({})
  const [notes, setNotes] = useState('')
  const [finishing, setFinishing] = useState(false)
  const [error, setError] = useState(null)
  const elapsed = useElapsed(session?.startedAt)

  // ── Persistencia diferida (debounce por ejercicio) ──────────────────────
  const persistTimers = useRef({})

  const persistExercise = useCallback((exId) => {
    clearTimeout(persistTimers.current[exId])
    persistTimers.current[exId] = setTimeout(() => {
      delete persistTimers.current[exId]
      syncExerciseSets(exId).catch(() => {})
    }, PERSIST_DELAY)
  }, [syncExerciseSets])

  const flushAll = useCallback(async () => {
    const timers = persistTimers.current
    Object.values(timers).forEach(clearTimeout)
    persistTimers.current = {}
    const exs = useWorkoutStore.getState().exercises
    await Promise.all(exs.map((ex) => syncExerciseSets(ex.exerciseId).catch(() => {})))
  }, [syncExerciseSets])

  // Limpieza de timers al desmontar
  useEffect(() => () => Object.values(persistTimers.current).forEach(clearTimeout), [])

  useEffect(() => {
    if (!isActive) navigate('/app/workout/start', { replace: true })
  }, [isActive, navigate])

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  // ── Última performance (se pide una sola vez por ejercicio) ──────────────
  const requestedPerf = useRef(new Set())
  useEffect(() => {
    exercises.forEach((ex) => {
      if (requestedPerf.current.has(ex.exerciseId)) return
      requestedPerf.current.add(ex.exerciseId)
      getLastPerformance(ex.exerciseId)
        .then((data) => setLastPerfs((p) => ({ ...p, [ex.exerciseId]: data })))
        .catch(() => {})
    })
  }, [exercises, getLastPerformance])

  // ── Handlers estables (no disparan red por tecla: store ahora, DB diferido) ─
  const onWeight = useCallback((exId, idx, value) => {
    useWorkoutStore.getState().updateSet(exId, idx, { weight_kg: value })
    persistExercise(exId)
  }, [persistExercise])

  const onReps = useCallback((exId, idx, value) => {
    useWorkoutStore.getState().updateSet(exId, idx, { reps: value })
    persistExercise(exId)
  }, [persistExercise])

  const onType = useCallback((exId, idx, value) => {
    useWorkoutStore.getState().updateSet(exId, idx, { set_type: value })
    persistExercise(exId)
  }, [persistExercise])

  const onComplete = useCallback((exId, idx) => {
    completeSet(exId, idx).catch((err) => setError(err.message))
    const set = useWorkoutStore.getState().exercises.find((e) => e.exerciseId === exId)?.sets[idx]
    if (set?.completed) restTimer.start()
  }, [completeSet, restTimer])

  const onDeleteSet = useCallback((exId, idx) => {
    deleteSet(exId, idx).catch((err) => setError(err.message))
  }, [deleteSet])

  const onDeleteExercise = useCallback((exId) => {
    clearTimeout(persistTimers.current[exId])
    deleteExercise(exId).catch((err) => setError(err.message))
  }, [deleteExercise])

  const onAddSet = useCallback((exId, data) => {
    addSet(exId, data).catch((err) => setError(err.message))
  }, [addSet])

  const handlePickExercise = useCallback((exercise) => {
    useWorkoutStore.getState().addExercise(exercise)
    setShowPicker(false)
  }, [])

  const handleFinish = async () => {
    try {
      setFinishing(true)
      restTimer.skip()
      await flushAll() // guardar lo que quedó pendiente antes de cerrar
      const sessionId = await finishSession(notes || null)

      // Logros: chequear y notificar los que se desbloquearon con este entreno.
      checkAndUnlock()
        .then((newly) => {
          for (const a of newly) {
            sileo.success({ title: `¡Logro desbloqueado! ${a.name}`, description: a.description })
          }
        })
        .catch(() => {})

      navigate(`/app/workout/summary/${sessionId}`, { replace: true })
    } catch (err) {
      setError(err.message)
      setFinishing(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('¿Cancelar el entrenamiento? Se perderán todos los datos.')) return
    Object.values(persistTimers.current).forEach(clearTimeout)
    persistTimers.current = {}
    restTimer.skip()
    await cancelSession()
    navigate('/app/dashboard', { replace: true })
  }

  if (!isActive) return null

  return (
    <div className="min-h-screen bg-ink-950 pb-28">
      <header className="bg-ink-900 border-b border-ink-800 px-5 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <p className="display text-base text-zinc-100">Entreno activo</p>
          <button onClick={handleCancel} className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-red-400 transition-colors">
            <X size={16} />
            Cancelar
          </button>
        </div>
      </header>

      {restTimer.isRunning && (
        <RestTimerBar remaining={restTimer.remaining} duration={restTimer.duration} onSkip={restTimer.skip} onAdd30={() => restTimer.addTime(30)} />
      )}

      <StatsBar exercises={exercises} elapsed={elapsed} />

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-4">
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
        )}

        {exercises.length === 0 && (
          <div className="text-center py-16 text-zinc-500">
            <Dumbbell size={40} className="mx-auto mb-3 text-zinc-700" />
            <p className="display text-sm text-zinc-400">Aún sin ejercicios</p>
            <p className="text-sm mt-1 text-zinc-600">Toca "Agregar ejercicio" para comenzar</p>
          </div>
        )}

        {exercises.map((ex) => (
          <ExerciseCard
            key={ex.exerciseId}
            exercise={ex}
            lastPerf={lastPerfs[ex.exerciseId]}
            onAddSet={onAddSet}
            onWeight={onWeight}
            onReps={onReps}
            onType={onType}
            onComplete={onComplete}
            onDeleteSet={onDeleteSet}
            onDeleteExercise={onDeleteExercise}
          />
        ))}

        <div className="card p-4">
          <label className="field-label">Notas del entrenamiento</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="¿Cómo te sentiste? ¿Algo a mejorar?"
            rows={3}
            className="input resize-none"
          />
        </div>
      </main>

      <div className="fixed bottom-0 inset-x-0 bg-ink-900 border-t border-ink-800 px-5 py-4 z-10 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button onClick={() => setShowPicker(true)} className="btn-dark px-4 py-3 text-sm shrink-0">
            <Plus size={16} />
            Ejercicio
          </button>
          <button onClick={handleFinish} disabled={finishing} className="btn-accent flex-1 py-3 text-sm">
            {finishing ? 'Guardando…' : 'Finalizar'}
          </button>
        </div>
      </div>

      {showPicker && (
        <ExercisePicker onSelect={handlePickExercise} onClose={() => setShowPicker(false)} excludeIds={exercises.map((ex) => ex.exerciseId)} />
      )}
    </div>
  )
}
