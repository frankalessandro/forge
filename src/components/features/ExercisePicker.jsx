import { useState, useEffect, useRef } from 'react'
import { X, Search, Dumbbell } from 'lucide-react'
import { useExercises, useMuscleGroups } from '../../hooks/useExercises'
import { useExerciseStore } from '../../stores/exerciseStore'

export default function ExercisePicker({ onSelect, onClose, excludeIds = [] }) {
  const [search, setSearch] = useState('')
  const [muscleGroupId, setMuscleGroupId] = useState(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250)
    return () => clearTimeout(t)
  }, [search])

  const { exercises, loading } = useExercises({ muscleGroupId, search: debouncedSearch })
  const { muscleGroups } = useMuscleGroups()

  const filtered = exercises.filter((ex) => !excludeIds.includes(ex.id))

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/40" onClick={onClose}>
      <div
        className="mt-auto bg-white rounded-t-2xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Elegir ejercicio</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-3 pb-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar ejercicio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>

        {/* Muscle group pills */}
        {muscleGroups.length > 0 && (
          <div className="px-5 pb-2 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              <button
                onClick={() => setMuscleGroupId(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  muscleGroupId === null
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              {muscleGroups.map((mg) => (
                <button
                  key={mg.id}
                  onClick={() => setMuscleGroupId(muscleGroupId === mg.id ? null : mg.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                    muscleGroupId === mg.id
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {mg.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Exercise list */}
        <div className="overflow-y-auto flex-1 px-5 pb-6">
          {loading && (
            <div className="space-y-2 pt-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <Dumbbell size={32} className="mx-auto mb-2 text-gray-200" />
              <p className="text-sm">No se encontraron ejercicios</p>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <ul className="pt-1 divide-y divide-gray-100">
              {filtered.map((ex) => (
                <li key={ex.id}>
                  <button
                    onClick={() => onSelect(ex)}
                    className="w-full flex items-center gap-3 py-3 text-left hover:bg-gray-50 transition-colors rounded-lg px-1"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{ex.name}</p>
                      {ex.muscle_groups && (
                        <p className="text-xs text-gray-400">{ex.muscle_groups.name}</p>
                      )}
                    </div>
                    {ex.equipment && (
                      <span className="text-xs text-gray-400 shrink-0">{ex.equipment}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
