import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Play, Pencil, Copy } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useRoutines } from '../../hooks/useRoutines'
import { useWorkout } from '../../hooks/useWorkout'
import { useWorkoutStore } from '../../stores/workoutStore'
import { useConfirm } from '../../hooks/useConfirm'
import PageHeader from '../../components/ui/PageHeader'
import CategoryBadge from '../../components/ui/CategoryBadge'

export default function RoutineDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getRoutineDetail, copyRoutine } = useRoutines()
  const { startSessionFromRoutine, cancelSession } = useWorkout()
  const isWorkoutActive = useWorkoutStore((s) => s.isActive)
  const { confirm, modal } = useConfirm()
  const [routine, setRoutine] = useState(null)
  const [isOwner, setIsOwner] = useState(false)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [copying, setCopying] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await getRoutineDetail(id)
        if (cancelled) return
        const userId = useAuthStore.getState().user?.id
        setRoutine(data)
        setIsOwner(Boolean(userId && data.user_id === userId))
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id, getRoutineDetail])

  const handleStart = async () => {
    // Ya hay un entreno en curso: preguntar antes de pisarlo en silencio.
    // Confirmar = descartar el entreno viejo y arrancar esta rutina;
    // cancelar = no hacer nada (el banner del dashboard permite retomarlo).
    if (isWorkoutActive) {
      const ok = await confirm({
        title: 'Tienes un entreno en curso',
        description: 'Para empezar esta rutina se descartará el entrenamiento activo y sus datos no guardados.',
        confirmLabel: 'Descartar y empezar',
        cancelLabel: 'Volver',
        danger: true,
      })
      if (!ok) return
    }
    try {
      setStarting(true)
      if (isWorkoutActive) await cancelSession()
      await startSessionFromRoutine(id)
      navigate('/app/workout/active')
    } catch (err) {
      setError(err.message)
      setStarting(false)
    }
  }

  const handleCopy = async () => {
    try {
      setCopying(true)
      const newId = await copyRoutine(id)
      navigate(`/app/routines/${newId}`)
    } catch (err) {
      setError(err.message)
      setCopying(false)
    }
  }

  const totalSets = routine?.routine_exercises.reduce((a, re) => a + (re.sets ?? 0), 0) ?? 0

  return (
    <div className="min-h-screen bg-ink-950">
      {modal}
      <PageHeader
        title="Rutina"
        back="/app/routines"
        right={
          isOwner && (
            <Link to={`/app/routines/${id}/edit`} className="btn-ghost text-sm px-2 py-1.5">
              <Pencil size={16} />
              Editar
            </Link>
          )
        }
      />

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-6 pb-[calc(var(--nav-h)+6rem)]">
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
        )}

        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-10 bg-ink-900 rounded-xl w-2/3" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 card" />
            ))}
          </div>
        ) : routine ? (
          <>
            <div>
              <CategoryBadge category={routine.category} color={routine.category_color} />
              <h2 className="font-display font-bold uppercase tracking-tight text-3xl text-zinc-100 leading-none mt-2">
                {routine.name}
              </h2>
              {routine.description && <p className="text-zinc-500 mt-2">{routine.description}</p>}
              <div className="flex gap-5 mt-4">
                <span className="text-sm text-zinc-400">
                  <span className="stat-num text-lg text-zinc-100 mr-1">{routine.routine_exercises.length}</span>
                  ejercicios
                </span>
                <span className="text-sm text-zinc-400">
                  <span className="stat-num text-lg text-zinc-100 mr-1">{totalSets}</span>
                  series
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              {routine.routine_exercises.map((re, i) => (
                <div key={re.id} className="card flex items-center gap-4 px-4 py-3.5">
                  <span className="stat-num text-lg text-zinc-700 w-6 shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <button
                    onClick={() => navigate(`/app/exercises/${re.exercise_id}`)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <p className="font-medium text-zinc-100 truncate">{re.exercises?.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {re.sets} × {re.reps} · {re.rest_seconds}s descanso
                    </p>
                  </button>
                  {re.exercises?.muscle_groups?.name && (
                    <span className="chip-muted shrink-0">{re.exercises.muscle_groups.name}</span>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : null}
      </main>

      {/* CTA fijo */}
      {!loading && routine && (
        <div className="fixed bottom-[var(--nav-h)] inset-x-0 z-30 bg-ink-950/90 backdrop-blur-md border-t border-ink-800 px-5 py-4">
          <div className="max-w-2xl mx-auto">
            {isOwner ? (
              <button onClick={handleStart} disabled={starting} className="btn-accent w-full py-3.5 text-sm">
                <Play size={18} fill="currentColor" />
                {starting ? 'Iniciando…' : 'Iniciar entrenamiento'}
              </button>
            ) : (
              <button onClick={handleCopy} disabled={copying} className="btn-accent w-full py-3.5 text-sm">
                <Copy size={18} />
                {copying ? 'Agregando…' : 'Agregar a mis rutinas'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
