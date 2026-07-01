import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Dumbbell, ChevronRight } from 'lucide-react'
import { useWorkout } from '../../../hooks/useWorkout'
import { useRoutines } from '../../../hooks/useRoutines'
import PageHeader from '../../../components/ui/PageHeader'
import CategoryBadge from '../../../components/ui/CategoryBadge'

export default function Start() {
  const navigate = useNavigate()
  const { startSession } = useWorkout()
  const { getPublicRoutines, getUserRoutines } = useRoutines()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [routines, setRoutines] = useState([])
  const [routinesLoading, setRoutinesLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [user, pub] = await Promise.all([getUserRoutines(), getPublicRoutines()])
        if (cancelled) return
        setRoutines([...user, ...pub])
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setRoutinesLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [getUserRoutines, getPublicRoutines])

  const handleStartFree = async () => {
    try {
      setLoading(true)
      setError(null)
      await startSession()
      navigate('/app/workout/active')
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink-950">
      <PageHeader title="Entrenar" back="/app/dashboard" />

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-8">
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
        )}

        {/* Sesión libre */}
        <button
          onClick={handleStartFree}
          disabled={loading}
          className="relative w-full overflow-hidden rounded-3xl bg-accent text-ink-950 p-6 text-left glow-accent disabled:opacity-60 group"
        >
          <div className="absolute -right-5 -bottom-7 opacity-20">
            <Play size={120} fill="currentColor" strokeWidth={0} />
          </div>
          <p className="font-display uppercase tracking-[0.2em] text-xs font-semibold opacity-70">Sesión libre</p>
          <p className="font-display font-bold uppercase text-3xl leading-none mt-2">
            {loading ? 'Iniciando…' : 'Empezar vacía'}
          </p>
          <p className="text-sm font-medium opacity-70 mt-2">Agrega ejercicios sobre la marcha</p>
        </button>

        {/* Desde rutina */}
        <section>
          <h2 className="section-title mb-3">Desde una rutina</h2>
          {routinesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 card animate-pulse" />
              ))}
            </div>
          ) : routines.length === 0 ? (
            <div className="card px-6 py-10 text-center">
              <Dumbbell size={32} className="mx-auto text-zinc-600 mb-3" />
              <p className="display text-sm text-zinc-300">Aún no hay rutinas</p>
              <button onClick={() => navigate('/app/routines/new')} className="text-sm text-accent hover:text-accent-bright mt-1">
                Crear una rutina
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {routines.map((r) => (
                <button
                  key={r.id}
                  onClick={() => navigate(`/app/routines/${r.id}`)}
                  className="w-full card card-hover flex items-center gap-4 px-5 py-4 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="display text-sm text-zinc-100 truncate">{r.name}</p>
                      <CategoryBadge category={r.category} />
                    </div>
                    <p className="eyebrow">{r.exerciseCount} ejercicios</p>
                  </div>
                  <ChevronRight size={18} className="text-zinc-600 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
