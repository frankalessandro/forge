import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Play, Pencil } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useRoutines } from '../../hooks/useRoutines'
import { useWorkout } from '../../hooks/useWorkout'
import PageHeader from '../../components/ui/PageHeader'

const CATEGORY_COLORS = {
  PPL: 'bg-sky-400/15 text-sky-300',
  'Full Body': 'bg-accent/15 text-accent',
  'Upper Lower': 'bg-fuchsia-400/15 text-fuchsia-300',
}

function CategoryBadge({ category }) {
  if (!category) return null
  const cls = CATEGORY_COLORS[category] ?? 'bg-ink-800 text-zinc-400'
  return <span className={`chip ${cls}`}>{category}</span>
}

export default function RoutineDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getRoutineDetail } = useRoutines()
  const { startSessionFromRoutine } = useWorkout()
  const [routine, setRoutine] = useState(null)
  const [isOwner, setIsOwner] = useState(false)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await getRoutineDetail(id)
        const userId = useAuthStore.getState().user?.id
        setRoutine(data)
        setIsOwner(Boolean(userId && data.user_id === userId))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, getRoutineDetail])

  const handleStart = async () => {
    try {
      setStarting(true)
      await startSessionFromRoutine(id)
      navigate('/app/workout/active')
    } catch (err) {
      setError(err.message)
      setStarting(false)
    }
  }

  const totalSets = routine?.routine_exercises.reduce((a, re) => a + (re.sets ?? 0), 0) ?? 0

  return (
    <div className="min-h-screen bg-ink-950">
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
              <CategoryBadge category={routine.category} />
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
            <button onClick={handleStart} disabled={starting} className="btn-accent w-full py-3.5 text-sm">
              <Play size={18} fill="currentColor" />
              {starting ? 'Iniciando…' : 'Iniciar entrenamiento'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
