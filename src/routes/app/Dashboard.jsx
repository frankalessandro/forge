import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Flame, Play, ClipboardList, Dumbbell, ChevronRight, Users } from 'lucide-react'
import { useDashboardStats } from '../../hooks/useDashboardStats'
import { useWorkoutStore } from '../../stores/workoutStore'
import Stat from '../../components/ui/Stat'

function greeting() {
  const h = new Date().getHours()
  if (h < 6) return 'Buenas noches'
  if (h < 13) return 'Buenos días'
  if (h < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function ActiveWorkoutBanner({ startedAt, exerciseCount }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt])

  return (
    <Link
      to="/app/workout/active"
      className="relative block overflow-hidden rounded-3xl bg-accent text-ink-950 p-6 glow-accent group"
    >
      <div className="absolute -right-6 -bottom-8 opacity-20">
        <Dumbbell size={140} strokeWidth={1.5} />
      </div>
      <p className="font-display uppercase tracking-[0.2em] text-xs font-semibold opacity-70">
        Entreno en curso · {exerciseCount} {exerciseCount === 1 ? 'ejercicio' : 'ejercicios'}
      </p>
      <p className="font-display font-bold uppercase text-4xl leading-[0.95] mt-2 tabular-nums">
        {formatClock(elapsed)}
      </p>
      <span className="inline-flex items-center gap-2 mt-5 font-display font-semibold uppercase tracking-wide text-sm bg-ink-950 text-accent rounded-xl px-4 py-2.5 group-hover:gap-3 transition-all">
        <Play size={16} fill="currentColor" />
        Continuar
      </span>
    </Link>
  )
}

export default function Dashboard() {
  const { data: stats, loading, error } = useDashboardStats()
  const name = stats?.name || ''
  const { session, exercises, isActive } = useWorkoutStore()

  return (
    <div className="min-h-screen bg-ink-950">
      {/* Top bar */}
      <header className="max-w-2xl mx-auto px-5 pt-8 pb-2 flex items-end justify-between">
        <div>
          <p className="eyebrow">{greeting()}</p>
          <h1 className="font-display font-bold uppercase tracking-tight text-2xl text-zinc-100 leading-none mt-1">
            {name || 'Atleta'}
          </h1>
        </div>
        <Link to="/app/streak" className="flex items-center gap-1.5 chip-accent hover:opacity-90 transition-opacity">
          <Flame size={13} />
          {loading || !stats ? '·' : stats.streak} sem
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-8">
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
        )}

        {/* HERO: empezar / entreno en curso */}
        {isActive && session ? (
          <ActiveWorkoutBanner startedAt={session.startedAt} exerciseCount={exercises.length} />
        ) : (
          <Link
            to="/app/workout/start"
            className="relative block overflow-hidden rounded-3xl bg-accent text-ink-950 p-6 glow-accent group"
          >
            <div className="absolute -right-6 -bottom-8 opacity-20">
              <Dumbbell size={140} strokeWidth={1.5} />
            </div>
            <p className="font-display uppercase tracking-[0.2em] text-xs font-semibold opacity-70">
              Listo para entrenar
            </p>
            <p className="font-display font-bold uppercase text-4xl leading-[0.95] mt-2">
              Empezar<br />entrenamiento
            </p>
            <span className="inline-flex items-center gap-2 mt-5 font-display font-semibold uppercase tracking-wide text-sm bg-ink-950 text-accent rounded-xl px-4 py-2.5 group-hover:gap-3 transition-all">
              <Play size={16} fill="currentColor" />
              Vamos
            </span>
          </Link>
        )}

        {/* Stats semana */}
        <section>
          <h2 className="section-title mb-3">Esta semana</h2>
          {loading ? (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-ink-900 border border-ink-800 animate-pulse" />
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-3 gap-3">
              <Stat value={stats.workouts.toLocaleString('es')} label="Entrenos" />
              <Stat
                value={(stats.volume > 0 ? Math.round(stats.volume / 1000 * 10) / 10 : 0).toLocaleString('es')}
                suffix="t"
                label="Volumen"
              />
              <Stat value={stats.streak.toLocaleString('es')} suffix="sem" label="Racha" variant="accent" to="/app/streak" />
            </div>
          ) : null}
        </section>

        {/* Accesos */}
        <section>
          <h2 className="section-title mb-3">Explorar</h2>
          <div className="space-y-3">
            <AccessRow to="/app/routines" icon={ClipboardList} title="Rutinas" subtitle="Plantillas y las tuyas" />
            <AccessRow to="/app/exercises" icon={Dumbbell} title="Ejercicios" subtitle="Catálogo por músculo" />
            <AccessRow to="/app/history" icon={Play} title="Progreso" subtitle="Historial y evolución" />
            <AccessRow to="/app/friends" icon={Users} title="Amigos" subtitle="Compara tu progreso" />
          </div>
        </section>
      </main>
    </div>
  )
}

function AccessRow({ to, icon: Icon, title, subtitle }) {
  return (
    <Link to={to} className="card card-hover flex items-center gap-4 px-5 py-4">
      <div className="bg-ink-800 rounded-xl p-3 text-accent shrink-0">
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="display text-sm text-zinc-100">{title}</p>
        <p className="text-sm text-zinc-500">{subtitle}</p>
      </div>
      <ChevronRight size={18} className="text-zinc-600 shrink-0" />
    </Link>
  )
}
