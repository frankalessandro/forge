import { useState, useEffect, useCallback, useRef, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Check, X, ChevronDown, ChevronUp, Dumbbell, SkipForward, Clock, Info, GripVertical, Minus } from 'lucide-react'
import { useWorkoutStore } from '../../../stores/workoutStore'
import { useWorkout } from '../../../hooks/useWorkout'
import { useRestTimer } from '../../../hooks/useRestTimer'
import { useAchievements } from '../../../hooks/useAchievements'
import { sileo } from 'sileo'
import { useConfirm } from '../../../hooks/useConfirm'
import ExercisePicker from '../../../components/features/ExercisePicker'
import TutorialGuide from '../../../components/features/TutorialGuide'
import { isDumbbell, displayWeight } from '../../../utils/weight'
import { logError } from '../../../utils/logError'

const PERSIST_DELAY = 600

// ── Helpers ────────────────────────────────────────────────────────────────
function formatClock(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function useElapsed(startedAt) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!startedAt) return
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt])
  return formatClock(elapsed)
}

function isExerciseDone(exercise) {
  return exercise.sets.length > 0 && exercise.sets.every((s) => s.completed)
}

function calcStats(exercises) {
  let completedSets = 0
  let volume = 0
  for (const ex of exercises) {
    for (const s of ex.sets) {
      if (s.completed) {
        completedSets++
        if (s.set_type !== 'warmup') volume += (s.reps ?? 0) * displayWeight(s.weight_kg, ex.equipment)
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

// ── Per-exercise timer (ticks on its own, doesn't re-render the card) ───────
function ExerciseTimer({ start, frozen }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (frozen != null || !start) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [start, frozen])

  if (!start) return null
  const ms = frozen != null ? frozen : now - start
  return (
    <span className="flex items-center gap-1 text-xs text-zinc-500 tabular-nums shrink-0">
      <Clock size={11} />
      {formatClock(Math.max(0, Math.floor(ms / 1000)))}
    </span>
  )
}

// ── Rest modal ───────────────────────────────────────────────────────────
function RestModal({ remaining, duration, onSkip, onAdd30 }) {
  const pct = duration > 0 ? Math.max(0, Math.min(1, remaining / duration)) : 0
  const circumference = 2 * Math.PI * 54
  const offset = circumference * (1 - pct)

  return (
    <div className="fixed inset-0 z-50 bg-ink-950/95 backdrop-blur-sm flex flex-col items-center justify-center px-6 animate-in">
      <span className="eyebrow mb-4">Descanso</span>
      <div className="relative w-56 h-56 flex items-center justify-center mb-10">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="var(--color-ink-800)" strokeWidth="6" />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <span className="stat-num text-5xl text-zinc-100">{formatClock(remaining)}</span>
      </div>
      <div className="flex gap-3 w-full max-w-xs">
        <button onClick={onAdd30} className="btn-dark flex-1 py-3 text-sm">
          +30s
        </button>
        <button onClick={onSkip} className="btn-accent flex-1 py-3 text-sm">
          <SkipForward size={16} />
          Saltar
        </button>
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
  exercise, lastPerf, isDone, isCollapsed, timerStart, timerFrozen,
  onAddSet, onWeight, onReps, onType, onComplete, onDeleteSet, onDeleteExercise,
  onToggleCollapse, onDragStart,
}) {
  const navigate = useNavigate()
  const lastSet = exercise.sets[exercise.sets.length - 1]
  const handleAddSet = () =>
    onAddSet(exercise.exerciseId, {
      reps: lastSet?.reps ?? null,
      weight_kg: lastSet?.weight_kg ?? null,
      set_type: lastSet?.set_type ?? 'normal',
    })

  const { completedSets } = calcStats([exercise])

  return (
    <div className="card p-4">
      <div className="flex items-start gap-2 mb-1">
        <button
          onPointerDown={(e) => onDragStart(e, exercise.exerciseId)}
          style={{ touchAction: 'none' }}
          className="text-zinc-600 hover:text-zinc-300 cursor-grab active:cursor-grabbing p-1 -ml-1 -mt-1 shrink-0"
        >
          <GripVertical size={16} />
        </button>

        <button
          onClick={() => onToggleCollapse(exercise.exerciseId)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          {isDone && (
            <span className="bg-accent text-ink-950 rounded-full p-0.5 shrink-0">
              <Check size={11} strokeWidth={3} />
            </span>
          )}
          <h3 className="display text-sm text-zinc-100 truncate">{exercise.name}</h3>
        </button>

        <ExerciseTimer start={timerStart} frozen={timerFrozen} />

        <button onClick={() => navigate(`/app/exercises/${exercise.exerciseId}`)} className="text-zinc-600 hover:text-accent transition-colors p-1 -mt-1">
          <Info size={16} />
        </button>
        <button onClick={() => onDeleteExercise(exercise.exerciseId)} className="text-zinc-600 hover:text-red-400 transition-colors p-1 -mr-1 -mt-1">
          <Trash2 size={16} />
        </button>
        <button onClick={() => onToggleCollapse(exercise.exerciseId)} className="text-zinc-600 hover:text-zinc-300 transition-colors p-1 -mt-1">
          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {isCollapsed ? (
        <p className="text-xs text-zinc-500 pl-1 mt-2">{completedSets} series completadas</p>
      ) : (
        <div className="mt-3">
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

          {isDumbbell(exercise.equipment) && (
            <p className="text-xs text-zinc-500 mb-2 -mt-1">
              Peso por mancuerna — el total registrado se duplica automáticamente.
            </p>
          )}

          {exercise.sets.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-1.5 py-1 px-1 eyebrow">
                <span className="w-5 text-center shrink-0">#</span>
                <span className="flex-1 min-w-0 text-center">{isDumbbell(exercise.equipment) ? 'kg/manc.' : 'kg'}</span>
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
      )}
    </div>
  )
})

// ── Live stats bar ─────────────────────────────────────────────────────────
function StatsBar({ exercises, elapsed }) {
  const { completedSets, volume } = calcStats(exercises)
  return (
    <div className="bg-ink-950 border-b border-ink-800 px-5 py-2.5" data-tutorial="workout-stats">
      <div className="max-w-2xl mx-auto grid grid-cols-3 text-center divide-x divide-ink-800">
        <div>
          <p className="stat-num text-xl text-accent">{elapsed}</p>
          <p className="eyebrow mt-0.5">tiempo total</p>
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
  const { session, exercises, isActive, hasHydrated } = useWorkoutStore()
  const {
    addSet, syncExerciseSets, completeSet, deleteSet,
    deleteExercise, finishSession, cancelSession, getLastPerformances,
  } = useWorkout()
  const restTimer = useRestTimer()
  const { checkAndUnlock } = useAchievements()
  const { confirm, modal } = useConfirm()

  const [showPicker, setShowPicker] = useState(false)
  const [lastPerfs, setLastPerfs] = useState({})
  // Las notas viven en el store persistido (sobreviven un refresh, como el
  // resto del entreno); antes eran estado local y se perdían.
  const notes = session?.notes ?? ''
  const [finishing, setFinishing] = useState(false)
  const [error, setError] = useState(null)
  const elapsed = useElapsed(session?.startedAt)

  // ── Auto-colapso de ejercicios al completar todas sus series ────────────
  const [collapsedIds, setCollapsedIds] = useState(() => new Set())
  const prevDoneRef = useRef({})
  useEffect(() => {
    exercises.forEach((ex) => {
      const done = isExerciseDone(ex)
      const wasDone = prevDoneRef.current[ex.exerciseId]
      if (done && !wasDone) {
        setCollapsedIds((prev) => {
          if (prev.has(ex.exerciseId)) return prev
          return new Set(prev).add(ex.exerciseId)
        })
      }
      prevDoneRef.current[ex.exerciseId] = done
    })
  }, [exercises])

  const onToggleCollapse = useCallback((exId) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(exId)) next.delete(exId)
      else next.add(exId)
      return next
    })
  }, [])

  // ── Temporizador por ejercicio, secuencial por posición ──────────────────
  // El timer corre solo para el ejercicio "activo" (el primero, por orden
  // actual, que aún no terminó sus series). Al completarlo se congela y
  // arranca el de la siguiente posición. Como está atado a la posición (no
  // al id del ejercicio), si el drag and drop cambia el orden, el timer de
  // "primer ejercicio" sigue siendo el de la posición 0, sea cual sea el
  // ejercicio que quede ahí.
  const segmentTimers = useRef({}) // { [index]: { start, frozen } }
  const prevActiveIndexRef = useRef(-1)

  // El ejercicio activo se deriva del orden actual: el primero que aún no terminó
  // sus series (o el último si ya están todos completos).
  let activeIndex = exercises.findIndex((ex) => !isExerciseDone(ex))
  if (activeIndex === -1) activeIndex = exercises.length - 1

  useEffect(() => {
    if (exercises.length === 0) return
    const idx = activeIndex

    if (idx !== prevActiveIndexRef.current) {
      const prevTimer = segmentTimers.current[prevActiveIndexRef.current]
      if (prevTimer && prevTimer.frozen == null && prevTimer.start != null) {
        prevTimer.frozen = Date.now() - prevTimer.start
      }
      prevActiveIndexRef.current = idx
    }

    if (!segmentTimers.current[idx]) {
      segmentTimers.current[idx] = { start: Date.now(), frozen: null }
    }
    if (isExerciseDone(exercises[idx]) && segmentTimers.current[idx].frozen == null) {
      segmentTimers.current[idx].frozen = Date.now() - segmentTimers.current[idx].start
    }
  }, [exercises, activeIndex])

  // ── Drag and drop para reordenar ejercicios ──────────────────────────────
  const itemRefs = useRef(new Map())
  const dragInfo = useRef({ currentIndex: 0 })
  const [dragId, setDragId] = useState(null)
  const [dragOffsetY, setDragOffsetY] = useState(0)

  const onDragStart = useCallback((e, exerciseId) => {
    e.preventDefault()
    const index = useWorkoutStore.getState().exercises.findIndex((ex) => ex.exerciseId === exerciseId)
    if (index < 0) return
    dragInfo.current.currentIndex = index
    setDragOffsetY(0)
    setDragId(exerciseId)
  }, [])

  useEffect(() => {
    if (!dragId) return

    const onMove = (e) => {
      setDragOffsetY((y) => y + e.movementY)

      const draggedNode = itemRefs.current.get(dragId)
      if (!draggedNode) return
      const draggedRect = draggedNode.getBoundingClientRect()
      const draggedCenter = draggedRect.top + draggedRect.height / 2

      const list = useWorkoutStore.getState().exercises
      const currentIndex = dragInfo.current.currentIndex

      for (let i = 0; i < list.length; i++) {
        if (i === currentIndex) continue
        const node = itemRefs.current.get(list[i].exerciseId)
        if (!node) continue
        const rect = node.getBoundingClientRect()
        const center = rect.top + rect.height / 2
        const crossed = (i < currentIndex && draggedCenter < center) || (i > currentIndex && draggedCenter > center)
        if (crossed) {
          useWorkoutStore.getState().reorderExercises(currentIndex, i)
          dragInfo.current.currentIndex = i
          break
        }
      }
    }

    const onUp = () => {
      setDragId(null)
      setDragOffsetY(0)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [dragId])

  // ── Persistencia diferida (debounce por ejercicio) ──────────────────────
  const persistTimers = useRef({})

  const persistExercise = useCallback((exId) => {
    clearTimeout(persistTimers.current[exId])
    persistTimers.current[exId] = setTimeout(() => {
      delete persistTimers.current[exId]
      syncExerciseSets(exId).catch((err) => logError('Active.persistExercise', err))
    }, PERSIST_DELAY)
  }, [syncExerciseSets])

  const flushAll = useCallback(async () => {
    const timers = persistTimers.current
    Object.values(timers).forEach(clearTimeout)
    persistTimers.current = {}
    const exs = useWorkoutStore.getState().exercises
    await Promise.all(exs.map((ex) => syncExerciseSets(ex.exerciseId).catch((err) => logError('Active.flushAll', err))))
  }, [syncExerciseSets])

  // Limpieza de timers al desmontar
  useEffect(() => () => Object.values(persistTimers.current).forEach(clearTimeout), [])

  useEffect(() => {
    // Esperamos a que termine de rehidratarse el store: recién ahí sabemos
    // si `isActive` es realmente false o es el valor inicial pre-rehidratación.
    if (hasHydrated && !isActive) navigate('/app/workout/start', { replace: true })
  }, [isActive, hasHydrated, navigate])

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  // ── Última performance (batcheada: una llamada para todos los pendientes) ─
  // Al montar con una rutina de N ejercicios sale UNA petición (2 queries),
  // no N; los ejercicios agregados después se piden en su propio batch.
  const requestedPerf = useRef(new Set())
  useEffect(() => {
    const pending = exercises
      .map((ex) => ex.exerciseId)
      .filter((id) => !requestedPerf.current.has(id))
    if (pending.length === 0) return
    pending.forEach((id) => requestedPerf.current.add(id))
    getLastPerformances(pending)
      .then((byExercise) => setLastPerfs((p) => ({ ...p, ...byExercise })))
      .catch((err) => logError('Active.getLastPerformances', err))
  }, [exercises, getLastPerformances])

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
    completeSet(exId, idx).catch((err) => { logError('Active.completeSet', err); setError(err.message) })
    const ex = useWorkoutStore.getState().exercises.find((e) => e.exerciseId === exId)
    const set = ex?.sets[idx]
    // Descanso de la rutina para este ejercicio; sin rutina, el default global.
    // Con descanso 0 (configurado explícitamente) no se abre el modal.
    const rest = ex?.restSeconds
    if (set?.completed && rest !== 0) restTimer.start(rest ?? undefined)
  }, [completeSet, restTimer])

  const onDeleteSet = useCallback((exId, idx) => {
    deleteSet(exId, idx).catch((err) => { logError('Active.deleteSet', err); setError(err.message) })
  }, [deleteSet])

  const onDeleteExercise = useCallback((exId) => {
    clearTimeout(persistTimers.current[exId])
    deleteExercise(exId).catch((err) => { logError('Active.deleteExercise', err); setError(err.message) })
  }, [deleteExercise])

  const onAddSet = useCallback((exId, data) => {
    addSet(exId, data).catch((err) => { logError('Active.addSet', err); setError(err.message) })
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
        .catch((err) => logError('Active.checkAndUnlock', err))

      navigate(`/app/workout/summary/${sessionId}`, { replace: true })
    } catch (err) {
      logError('Active.handleFinish', err)
      setError(err.message)
      setFinishing(false)
    }
  }

  const handleCancel = async () => {
    const ok = await confirm({
      title: '¿Cancelar el entrenamiento?',
      description: 'Se perderán todos los datos registrados en esta sesión.',
      confirmLabel: 'Cancelar entreno',
      cancelLabel: 'Seguir entrenando',
      danger: true,
    })
    if (!ok) return
    Object.values(persistTimers.current).forEach(clearTimeout)
    persistTimers.current = {}
    restTimer.skip()
    await cancelSession()
    navigate('/app/dashboard', { replace: true })
  }

  if (!isActive) return null

  return (
    <div className="min-h-screen bg-ink-950 pb-28" style={{ touchAction: 'pan-y' }}>
      {modal}
      {/* La barra inferior propia del entreno es más alta que la tab bar */}
      <TutorialGuide module="workout" buttonClassName="bottom-24 right-4" />

      <header className="bg-ink-900 border-b border-ink-800 px-5 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/app/dashboard')}
            data-tutorial="workout-minimize"
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors -ml-1 p-1"
            aria-label="Minimizar entreno"
          >
            <Minus size={18} />
          </button>
          <p className="display text-base text-zinc-100">Entreno activo</p>
          <button onClick={handleCancel} className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-red-400 transition-colors">
            <X size={16} />
            Cancelar
          </button>
        </div>
      </header>

      {restTimer.isRunning && (
        <RestModal remaining={restTimer.remaining} duration={restTimer.duration} onSkip={restTimer.skip} onAdd30={() => restTimer.addTime(30)} />
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

        {/* Lectura intencional del ref de timers: es una caché que no debe
            re-renderizar; ExerciseCard avanza el cronómetro por su cuenta. */}
        {/* eslint-disable-next-line react-hooks/refs */}
        {exercises.map((ex, index) => {
          const isDragging = dragId === ex.exerciseId
          const timer = segmentTimers.current[index]
          return (
            <div
              key={ex.exerciseId}
              data-tutorial={index === 0 ? 'workout-exercise' : undefined}
              ref={(node) => {
                if (node) itemRefs.current.set(ex.exerciseId, node)
                else itemRefs.current.delete(ex.exerciseId)
              }}
              style={
                isDragging
                  ? { transform: `translateY(${dragOffsetY}px)`, position: 'relative', zIndex: 20 }
                  : undefined
              }
              className={isDragging ? 'opacity-95 shadow-2xl shadow-black/60' : ''}
            >
              <ExerciseCard
                exercise={ex}
                lastPerf={lastPerfs[ex.exerciseId]}
                isDone={isExerciseDone(ex)}
                isCollapsed={collapsedIds.has(ex.exerciseId)}
                timerStart={timer?.start}
                timerFrozen={timer?.frozen ?? null}
                onAddSet={onAddSet}
                onWeight={onWeight}
                onReps={onReps}
                onType={onType}
                onComplete={onComplete}
                onDeleteSet={onDeleteSet}
                onDeleteExercise={onDeleteExercise}
                onToggleCollapse={onToggleCollapse}
                onDragStart={onDragStart}
              />
            </div>
          )
        })}

        <div className="card p-4">
          <label className="field-label">Notas del entrenamiento</label>
          <textarea
            value={notes}
            onChange={(e) => useWorkoutStore.getState().setNotes(e.target.value)}
            placeholder="¿Cómo te sentiste? ¿Algo a mejorar?"
            rows={3}
            className="input resize-none"
          />
        </div>
      </main>

      <div className="fixed bottom-0 inset-x-0 bg-ink-900 border-t border-ink-800 px-5 py-4 z-10 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button onClick={() => setShowPicker(true)} data-tutorial="workout-add" className="btn-dark px-4 py-3 text-sm shrink-0">
            <Plus size={16} />
            Ejercicio
          </button>
          <button onClick={handleFinish} disabled={finishing} data-tutorial="workout-finish" className="btn-accent flex-1 py-3 text-sm">
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
