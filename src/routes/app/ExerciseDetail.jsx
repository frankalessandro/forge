import { useParams } from 'react-router-dom'
import { Dumbbell } from 'lucide-react'
import { useExercise } from '../../hooks/useExercises'
import PageHeader from '../../components/ui/PageHeader'

function SkeletonDetail() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-9 bg-ink-900 rounded w-1/2" />
      <div className="flex gap-2">
        <div className="h-7 bg-ink-900 rounded-full w-24" />
        <div className="h-7 bg-ink-900 rounded-full w-20" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-ink-900 rounded w-full" />
        <div className="h-4 bg-ink-900 rounded w-5/6" />
        <div className="h-4 bg-ink-900 rounded w-4/6" />
      </div>
    </div>
  )
}

export default function ExerciseDetail() {
  const { id } = useParams()
  const { exercise, loading, error } = useExercise(id)

  return (
    <div className="min-h-screen bg-ink-950">
      <PageHeader title="Ejercicio" back={true} />

      <main className="max-w-2xl mx-auto px-5 py-6">
        {loading && <SkeletonDetail />}
        {error && <p className="text-red-400">Error: {error}</p>}

        {!loading && !error && exercise && (
          <div className="space-y-7">
            <div>
              <h1 className="font-display font-bold uppercase tracking-tight text-3xl text-zinc-100 leading-none mb-3">
                {exercise.name}
              </h1>
              <div className="flex flex-wrap gap-2">
                {exercise.category && <span className="chip-muted">{exercise.category}</span>}
                {exercise.muscle_groups && <span className="chip-accent">{exercise.muscle_groups.name}</span>}
                {exercise.equipment && (
                  <span className="chip-muted"><Dumbbell size={12} className="inline mr-0.5" />{exercise.equipment}</span>
                )}
              </div>
            </div>

            {exercise.description && (
              <div>
                <h2 className="section-title mb-2">Descripción</h2>
                <p className="text-zinc-300 leading-relaxed">{exercise.description}</p>
              </div>
            )}

            {exercise.primary_muscles?.length > 0 && (
              <div>
                <h2 className="section-title mb-2">Músculos principales</h2>
                <div className="flex flex-wrap gap-2">
                  {exercise.primary_muscles.map((m) => <span key={m} className="chip-accent">{m}</span>)}
                </div>
              </div>
            )}

            {exercise.secondary_muscles?.length > 0 && (
              <div>
                <h2 className="section-title mb-2">Músculos secundarios</h2>
                <div className="flex flex-wrap gap-2">
                  {exercise.secondary_muscles.map((m) => <span key={m} className="chip-muted">{m}</span>)}
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && !error && !exercise && <p className="text-zinc-500">Ejercicio no encontrado.</p>}
      </main>
    </div>
  )
}
