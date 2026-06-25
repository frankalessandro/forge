import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Dumbbell } from 'lucide-react'
import { useExercises, useMuscleGroups } from '../../hooks/useExercises'
import { useExerciseStore } from '../../stores/exerciseStore'

const EQUIPMENT_OPTIONS = [
  'Barbell', 'Dumbbell', 'Kettlebell', 'Machine', 'Cable',
  'Resistance Band', 'Bodyweight', 'Other',
]

function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
    </div>
  )
}

function PillButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
        active
          ? 'bg-gray-900 text-white'
          : 'bg-white text-gray-600 border border-gray-300 hover:border-gray-400'
      }`}
    >
      {label}
    </button>
  )
}

export default function Exercises() {
  const { muscleGroupId, equipment, search, setMuscleGroup, setEquipment, setSearch } =
    useExerciseStore()

  const [searchInput, setSearchInput] = useState(search)

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput, setSearch])

  const { exercises, loading } = useExercises({ muscleGroupId, equipment, search })
  const { muscleGroups } = useMuscleGroups()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/app/dashboard" className="text-xl font-bold text-gray-900">FORGE</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Ejercicios</h1>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar ejercicio..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        {/* Muscle group filters */}
        {muscleGroups.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Grupo muscular</p>
            <div className="flex gap-2 flex-wrap">
              <PillButton
                label="Todos"
                active={muscleGroupId === null}
                onClick={() => setMuscleGroup(null)}
              />
              {muscleGroups.map((mg) => (
                <PillButton
                  key={mg.id}
                  label={mg.name}
                  active={muscleGroupId === mg.id}
                  onClick={() => setMuscleGroup(muscleGroupId === mg.id ? null : mg.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Equipment filters */}
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Equipamiento</p>
          <div className="flex gap-2 flex-wrap">
            <PillButton
              label="Todos"
              active={equipment === null}
              onClick={() => setEquipment(null)}
            />
            {EQUIPMENT_OPTIONS.map((eq) => (
              <PillButton
                key={eq}
                label={eq}
                active={equipment === eq}
                onClick={() => setEquipment(equipment === eq ? null : eq)}
              />
            ))}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : exercises.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Dumbbell size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No se encontraron ejercicios</p>
            <p className="text-sm mt-1">Probá con otros filtros</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {exercises.map((ex) => (
              <Link
                key={ex.id}
                to={`/app/exercises/${ex.id}`}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-400 transition-colors"
              >
                <p className="font-medium text-gray-900">{ex.name}</p>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  {ex.muscle_groups && (
                    <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                      {ex.muscle_groups.name}
                    </span>
                  )}
                  {ex.equipment && (
                    <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                      {ex.equipment}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
