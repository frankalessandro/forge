import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Dumbbell } from 'lucide-react'
import { useExercise } from '../../hooks/useExercises'

function Badge({ children }) {
  return (
    <span className="inline-block bg-gray-800 text-gray-300 text-sm rounded-full px-3 py-1">
      {children}
    </span>
  )
}

function SkeletonDetail() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-7 bg-gray-800 rounded w-1/2" />
      <div className="flex gap-2">
        <div className="h-6 bg-gray-800 rounded-full w-24" />
        <div className="h-6 bg-gray-800 rounded-full w-20" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-800 rounded w-full" />
        <div className="h-4 bg-gray-800 rounded w-5/6" />
        <div className="h-4 bg-gray-800 rounded w-4/6" />
      </div>
    </div>
  )
}

export default function ExerciseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { exercise, loading, error } = useExercise(id)

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-100 transition-colors"
          >
            <ArrowLeft size={16} />
            Volver a ejercicios
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {loading && <SkeletonDetail />}

        {error && (
          <p className="text-red-600">Error: {error}</p>
        )}

        {!loading && !error && exercise && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-100 mb-3">{exercise.name}</h1>
              <div className="flex flex-wrap gap-2">
                {exercise.category && <Badge>{exercise.category}</Badge>}
                {exercise.muscle_groups && <Badge>{exercise.muscle_groups.name}</Badge>}
                {exercise.equipment && <Badge><Dumbbell size={13} className="inline mr-1" />{exercise.equipment}</Badge>}
              </div>
            </div>

            {exercise.description && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Descripción</h2>
                <p className="text-gray-300 leading-relaxed">{exercise.description}</p>
              </div>
            )}

            {exercise.primary_muscles?.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Músculos principales</h2>
                <div className="flex flex-wrap gap-2">
                  {exercise.primary_muscles.map((m) => (
                    <Badge key={m}>{m}</Badge>
                  ))}
                </div>
              </div>
            )}

            {exercise.secondary_muscles?.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Músculos secundarios</h2>
                <div className="flex flex-wrap gap-2">
                  {exercise.secondary_muscles.map((m) => (
                    <Badge key={m}>{m}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && !error && !exercise && (
          <p className="text-gray-500">Ejercicio no encontrado.</p>
        )}
      </main>
    </div>
  )
}
