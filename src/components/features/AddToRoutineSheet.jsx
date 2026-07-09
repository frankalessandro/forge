import { useState, useEffect } from 'react'
import { sileo } from 'sileo'
import { X, Plus, Check, Dumbbell } from 'lucide-react'
import { useRoutines } from '../../hooks/useRoutines'

export default function AddToRoutineSheet({ exerciseId, onClose }) {
  const { getUserRoutines, createRoutine, addExerciseToRoutine } = useRoutines()
  const [routines, setRoutines] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingId, setAddingId] = useState(null)
  const [addedId, setAddedId] = useState(null)
  const [creatingNew, setCreatingNew] = useState(false)
  const [newRoutineName, setNewRoutineName] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await getUserRoutines()
        if (!cancelled) setRoutines(data)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [getUserRoutines])

  const handleAdd = async (routineId, routineName) => {
    try {
      setError(null)
      setAddingId(routineId)
      await addExerciseToRoutine(routineId, exerciseId)
      setAddedId(routineId)
      sileo.success({ title: `Agregado a "${routineName}"` })
      setTimeout(onClose, 500)
    } catch (err) {
      setError(err.message)
      sileo.error({ title: 'Error al agregar', description: err.message })
      setAddingId(null)
    }
  }

  const handleCreateAndAdd = async () => {
    const name = newRoutineName.trim()
    if (!name) return
    try {
      setError(null)
      setAddingId('new')
      const newId = await createRoutine({ name })
      await addExerciseToRoutine(newId, exerciseId)
      setAddedId(newId)
      sileo.success({ title: `Agregado a "${name}"` })
      setTimeout(onClose, 500)
    } catch (err) {
      setError(err.message)
      sileo.error({ title: 'Error al agregar', description: err.message })
      setAddingId(null)
    }
  }

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
          <h2 className="display text-sm text-zinc-100">Agregar a rutina</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-3">
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-3">{error}</p>
          )}

          {loading && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 bg-ink-850 rounded-lg animate-pulse" />
              ))}
            </div>
          )}

          {!loading && routines.length === 0 && !creatingNew && (
            <div className="text-center py-8 text-zinc-500">
              <Dumbbell size={32} className="mx-auto mb-2 text-zinc-700" />
              <p className="text-sm">Todavía no tienes rutinas propias</p>
            </div>
          )}

          {!loading && routines.length > 0 && (
            <ul className="divide-y divide-ink-800">
              {routines.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => handleAdd(r.id, r.name)}
                    disabled={addingId !== null}
                    className="w-full flex items-center gap-3 py-3 text-left hover:bg-ink-850 transition-colors rounded-lg px-2 -mx-2 disabled:opacity-60"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-100 truncate">{r.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{r.exerciseCount} ejercicios</p>
                    </div>
                    {addedId === r.id ? (
                      <Check size={18} className="text-accent shrink-0" />
                    ) : addingId === r.id ? (
                      <span className="text-xs text-zinc-500 shrink-0">Agregando…</span>
                    ) : (
                      <Plus size={18} className="text-zinc-500 shrink-0" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!loading && (
            <div className="mt-3 pt-3 border-t border-ink-800">
              {creatingNew ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Nombre de la rutina"
                    value={newRoutineName}
                    onChange={(e) => setNewRoutineName(e.target.value)}
                    className="input flex-1"
                  />
                  <button
                    onClick={handleCreateAndAdd}
                    disabled={addingId !== null || !newRoutineName.trim()}
                    className="btn-accent px-4 text-sm shrink-0"
                  >
                    {addingId === 'new' ? '…' : 'Crear'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCreatingNew(true)}
                  className="w-full flex items-center gap-2 py-2.5 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
                >
                  <Plus size={16} />
                  Crear nueva rutina
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
