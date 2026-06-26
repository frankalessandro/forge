import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Dumbbell } from 'lucide-react'
import { useExercises, useMuscleGroups } from '../../hooks/useExercises'
import { useExerciseStore } from '../../stores/exerciseStore'
import PageHeader from '../../components/ui/PageHeader'

const EQUIPMENT_OPTIONS = [
  'Barbell', 'Dumbbell', 'Kettlebell', 'Machine', 'Cable', 'Resistance Band', 'Bodyweight', 'Other',
]

function Pill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-display font-semibold uppercase tracking-wide transition-colors whitespace-nowrap ${
        active ? 'bg-accent text-ink-950' : 'bg-ink-900 text-zinc-400 border border-ink-700 hover:border-ink-600'
      }`}
    >
      {label}
    </button>
  )
}

export default function Exercises() {
  const { muscleGroupId, equipment, search, setMuscleGroup, setEquipment, setSearch } = useExerciseStore()
  const [searchInput, setSearchInput] = useState(search)

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput, setSearch])

  const { exercises, loading } = useExercises({ muscleGroupId, equipment, search })
  const { muscleGroups } = useMuscleGroups()

  return (
    <div className="min-h-screen bg-ink-950">
      <PageHeader title="Ejercicios" back="/app/dashboard" />

      <main className="max-w-2xl mx-auto px-5 py-6">
        <div className="relative mb-5">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar ejercicio…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="input pl-10 py-3"
          />
        </div>

        {muscleGroups.length > 0 && (
          <div className="mb-3">
            <p className="section-title mb-2">Grupo muscular</p>
            <div className="flex gap-2 flex-wrap">
              <Pill label="Todos" active={muscleGroupId === null} onClick={() => setMuscleGroup(null)} />
              {muscleGroups.map((mg) => (
                <Pill key={mg.id} label={mg.name} active={muscleGroupId === mg.id} onClick={() => setMuscleGroup(muscleGroupId === mg.id ? null : mg.id)} />
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <p className="section-title mb-2">Equipamiento</p>
          <div className="flex gap-2 flex-wrap">
            <Pill label="Todos" active={equipment === null} onClick={() => setEquipment(null)} />
            {EQUIPMENT_OPTIONS.map((eq) => (
              <Pill key={eq} label={eq} active={equipment === eq} onClick={() => setEquipment(equipment === eq ? null : eq)} />
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-20 card animate-pulse" />)}
          </div>
        ) : exercises.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <Dumbbell size={40} className="mx-auto mb-3 text-zinc-700" />
            <p className="display text-sm text-zinc-400">No se encontraron ejercicios</p>
            <p className="text-sm mt-1 text-zinc-600">Prueba con otros filtros</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {exercises.map((ex) => (
              <Link key={ex.id} to={`/app/exercises/${ex.id}`} className="card card-hover p-4">
                <p className="display text-sm text-zinc-100">{ex.name}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {ex.muscle_groups && <span className="chip-muted">{ex.muscle_groups.name}</span>}
                  {ex.equipment && <span className="chip-muted">{ex.equipment}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
