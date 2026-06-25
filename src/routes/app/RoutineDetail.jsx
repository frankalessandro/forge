import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Play } from 'lucide-react'
import { useRoutines } from '../../hooks/useRoutines'
import { useWorkout } from '../../hooks/useWorkout'

const CATEGORY_COLORS = {
  PPL: 'bg-blue-100 text-blue-700',
  'Full Body': 'bg-green-100 text-green-700',
  'Upper Lower': 'bg-purple-100 text-purple-700',
}

function CategoryBadge({ category }) {
  const cls = CATEGORY_COLORS[category] ?? 'bg-gray-800 text-gray-300'
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{category}</span>
}

function SkeletonDetail() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-6 bg-gray-800 rounded w-56" />
        <div className="h-4 bg-gray-800 rounded w-80" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
            <div className="h-4 bg-gray-800 rounded w-48 mb-2" />
            <div className="h-3 bg-gray-800 rounded w-32" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RoutineDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getRoutineDetail } = useRoutines()
  const { startSessionFromRoutine } = useWorkout()
  const [routine, setRoutine] = useState(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await getRoutineDetail(id)
        setRoutine(data)
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

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link to="/app/routines" className="text-gray-500 hover:text-gray-100 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold text-gray-100">Detalle de rutina</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
        )}

        {loading ? (
          <SkeletonDetail />
        ) : routine ? (
          <>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-gray-100">{routine.name}</h2>
                <CategoryBadge category={routine.category} />
              </div>
              {routine.description && <p className="text-gray-500">{routine.description}</p>}
            </div>

            <div className="space-y-3">
              {routine.routine_exercises.map((re) => (
                <div key={re.id} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center gap-4">
                  <span className="text-sm font-bold text-gray-500 w-5 shrink-0">{re.order}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-100 truncate">{re.exercises?.name}</p>
                    <p className="text-sm text-gray-500">
                      {re.sets} series × {re.reps} reps · {re.rest_seconds}s descanso
                    </p>
                  </div>
                  {re.exercises?.muscle_groups?.name && (
                    <span className="text-xs font-medium bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full shrink-0">
                      {re.exercises.muscle_groups.name}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleStart}
              disabled={starting}
              className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white rounded-xl px-6 py-4 font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
            >
              <Play size={18} fill="white" />
              {starting ? 'Iniciando...' : 'Iniciar entrenamiento'}
            </button>
          </>
        ) : null}
      </main>
    </div>
  )
}
