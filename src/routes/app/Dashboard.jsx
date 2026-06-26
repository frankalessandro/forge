import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Flame, Play, ClipboardList, Dumbbell, ChevronRight, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { buildWeeks, computeStreak, getMonday } from '../../utils/streak'

function getMondayOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function calcVolume(sets) {
  return sets
    .filter((s) => s.set_type !== 'warmup')
    .reduce((acc, s) => acc + (s.reps ?? 0) * (s.weight_kg ?? 0), 0)
}

function greeting() {
  const h = new Date().getHours()
  if (h < 6) return 'Buenas noches'
  if (h < 13) return 'Buenos días'
  if (h < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const now = new Date()
      const monday = getMondayOfWeek(now)

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, training_days_per_week')
        .maybeSingle()
      if (profile?.name) setName(profile.name)
      const goal = profile?.training_days_per_week || 1

      const { data: weekSessions } = await supabase
        .from('workout_sessions')
        .select('id, started_at')
        .not('finished_at', 'is', null)
        .gte('started_at', monday.toISOString())

      let weekVolume = 0
      if (weekSessions && weekSessions.length > 0) {
        const ids = weekSessions.map((s) => s.id)
        const { data: weekSets } = await supabase
          .from('workout_sets')
          .select('reps, weight_kg, set_type')
          .in('session_id', ids)
        weekVolume = calcVolume(weekSets ?? [])
      }

      // Racha semanal: cuenta semanas consecutivas que cumplen el objetivo
      // de días/semana del usuario (no días consecutivos de calendario).
      const since = getMonday(now)
      since.setDate(since.getDate() - 11 * 7)
      const { data: recentSessions } = await supabase
        .from('workout_sessions')
        .select('started_at')
        .not('finished_at', 'is', null)
        .gte('started_at', since.toISOString())

      const weeks = buildWeeks((recentSessions ?? []).map((s) => s.started_at), goal, 12)
      const streak = computeStreak(weeks)

      setStats({ workouts: weekSessions?.length ?? 0, volume: weekVolume, streak })
      setLoading(false)
    }
    load()
  }, [])

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
          {loading ? '·' : stats.streak} sem
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-8">
        {/* HERO: empezar */}
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

        {/* Stats semana */}
        <section>
          <h2 className="section-title mb-3">Esta semana</h2>
          {loading ? (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-ink-900 border border-ink-800 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <Stat value={stats.workouts} label="Entrenos" />
              <Stat
                value={stats.volume > 0 ? Math.round(stats.volume / 1000 * 10) / 10 : 0}
                suffix="t"
                label="Volumen"
              />
              <Stat value={stats.streak} suffix="sem" label="Racha" accent to="/app/streak" />
            </div>
          )}
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

function Stat({ value, label, suffix, accent, to }) {
  const className = `block rounded-2xl border p-4 ${
    accent ? 'bg-accent/10 border-accent/25' : 'bg-ink-900 border-ink-800'
  } ${to ? 'card-hover' : ''}`
  const inner = (
    <>
      <p className={`stat-num text-3xl ${accent ? 'text-accent' : 'text-zinc-100'}`}>
        {typeof value === 'number' ? value.toLocaleString('es-AR') : value}
        {suffix && <span className="text-base font-semibold text-zinc-500 ml-0.5">{suffix}</span>}
      </p>
      <p className="eyebrow mt-1.5">{label}</p>
    </>
  )
  return to ? <Link to={to} className={className}>{inner}</Link> : <div className={className}>{inner}</div>
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
