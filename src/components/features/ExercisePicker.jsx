import { useState, useEffect, useRef } from 'react'
import { X, Search, Dumbbell } from 'lucide-react'
import { useExercises, useMuscleGroups } from '../../hooks/useExercises'

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
    <div className="fixed inset-0 z-50 flex flex-col bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mt-auto bg-ink-900 border-t border-ink-700 rounded-t-3xl flex flex-col max-h-[85vh] pb-[env(safe-area-inset-bottom)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-ink-600 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-ink-800">
          <h2 className="display text-sm text-zinc-100">Elegir ejercicio</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pt-3 pb-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar ejercicio…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
        </div>

        {muscleGroups.length > 0 && (
          <div className="px-5 pb-2 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              <Pill active={muscleGroupId === null} onClick={() => setMuscleGroupId(null)}>Todos</Pill>
              {muscleGroups.map((mg) => (
                <Pill key={mg.id} active={muscleGroupId === mg.id} onClick={() => setMuscleGroupId(muscleGroupId === mg.id ? null : mg.id)}>
                  {mg.name}
                </Pill>
              ))}
            </div>
          </div>
        )}

        <div className="overflow-y-auto flex-1 px-5 pb-6">
          {loading && (
            <div className="space-y-2 pt-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 bg-ink-850 rounded-lg animate-pulse" />
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-10 text-zinc-500">
              <Dumbbell size={32} className="mx-auto mb-2 text-zinc-700" />
              <p className="text-sm">No se encontraron ejercicios</p>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <ul className="pt-1 divide-y divide-ink-800">
              {filtered.map((ex) => (
                <li key={ex.id}>
                  <button onClick={() => onSelect(ex)} className="w-full flex items-center gap-3 py-3 text-left hover:bg-ink-850 transition-colors rounded-lg px-2 -mx-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-100">{ex.name_es ?? ex.name}</p>
                      {ex.muscle_groups && <p className="text-xs text-zinc-500">{ex.muscle_groups.name}</p>}
                    </div>
                    {ex.equipment && <span className="chip-muted shrink-0">{ex.equipment}</span>}
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

function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-display font-semibold uppercase tracking-wide transition-colors whitespace-nowrap ${
        active ? 'bg-accent text-ink-950' : 'bg-ink-800 text-zinc-400 hover:bg-ink-700'
      }`}
    >
      {children}
    </button>
  )
}
