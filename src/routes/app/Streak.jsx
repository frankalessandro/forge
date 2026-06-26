import { useState, useEffect } from 'react'
import { Flame, Target, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import PageHeader from '../../components/ui/PageHeader'
import { buildWeeks, computeStreak, getMonday, toDateStr } from '../../utils/streak'

const DAY_LABELS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']

const GOAL_LABELS = {
  lose_fat: 'Perder grasa',
  gain_muscle: 'Ganar músculo',
  strength: 'Fuerza',
  endurance: 'Resistencia',
  health: 'Salud general',
}

export default function Streak() {
  const [loading, setLoading] = useState(true)
  const [weeks, setWeeks] = useState([])
  const [streak, setStreak] = useState(0)
  const [target, setTarget] = useState(1)
  const [goal, setGoal] = useState(null)
  const [trainedSet, setTrainedSet] = useState(() => new Set())

  useEffect(() => {
    async function load() {
      setLoading(true)

      const { data: profile } = await supabase
        .from('profiles')
        .select('training_days_per_week, goal')
        .maybeSingle()

      const targetDays = profile?.training_days_per_week || 1
      setTarget(targetDays)
      setGoal(profile?.goal ?? null)

      // Traemos sesiones finalizadas de las últimas 12 semanas.
      const since = getMonday(new Date())
      since.setDate(since.getDate() - 11 * 7)

      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('started_at')
        .not('finished_at', 'is', null)
        .gte('started_at', since.toISOString())

      const dates = (sessions ?? []).map((s) => s.started_at)
      const builtWeeks = buildWeeks(dates, targetDays, 12)
      setWeeks(builtWeeks)
      setStreak(computeStreak(builtWeeks))
      setTrainedSet(new Set(dates.map(toDateStr)))
      setLoading(false)
    }
    load()
  }, [])

  const current = weeks[0]
  const remaining = current ? Math.max(0, target - current.count) : target

  return (
    <div className="min-h-screen bg-ink-950">
      <PageHeader title="Tu racha" back="/app/dashboard" />

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-6">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-40 card" />
            <div className="h-64 card" />
          </div>
        ) : (
          <>
            {/* Hero racha */}
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-accent/20 to-accent/5 border border-accent/25 p-6">
              <div className="absolute -right-4 -bottom-6 opacity-20">
                <Flame size={140} strokeWidth={1.5} className="text-accent" />
              </div>
              <p className="font-display uppercase tracking-[0.2em] text-xs font-semibold text-accent/80">
                Racha semanal
              </p>
              <div className="flex items-end gap-2 mt-2">
                <span className="stat-num text-6xl text-accent leading-none">{streak}</span>
                <span className="display text-lg text-zinc-300 mb-1.5">
                  {streak === 1 ? 'semana' : 'semanas'}
                </span>
              </div>
              <p className="text-sm text-zinc-400 mt-3 max-w-xs">
                Tu racha se mantiene cumpliendo tu objetivo de{' '}
                <strong className="text-zinc-100">{target} {target === 1 ? 'día' : 'días'}</strong> por semana.
                No importa qué días entrenes, sino llegar a tu meta.
              </p>
            </div>

            {/* Objetivo de la semana en curso */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target size={16} className="text-accent" />
                <h2 className="section-title">Esta semana</h2>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="stat-num text-3xl text-zinc-100">
                    {current?.count ?? 0}
                    <span className="text-lg text-zinc-500">/{target}</span>
                  </p>
                  <p className="eyebrow mt-1">días entrenados</p>
                </div>
                <p className={`text-sm font-medium ${current?.met ? 'text-accent' : 'text-zinc-400'}`}>
                  {current?.met
                    ? '¡Objetivo cumplido!'
                    : remaining === 1
                      ? 'Falta 1 día'
                      : `Faltan ${remaining} días`}
                </p>
              </div>
              <div className="mt-3 h-2 bg-ink-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((current?.count ?? 0) / target) * 100)}%` }}
                />
              </div>
              {goal && (
                <p className="text-xs text-zinc-600 mt-3">
                  Objetivo: <span className="text-zinc-400">{GOAL_LABELS[goal] ?? goal}</span>
                </p>
              )}
            </div>

            {/* Calendario de días entrenados */}
            <Calendar trainedSet={trainedSet} />
          </>
        )}
      </main>
    </div>
  )
}

function buildMonthCells(year, month) {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7 // 0 = lunes
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function Calendar({ trainedSet }) {
  const now = new Date()
  const [view, setView] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1))

  const cells = buildMonthCells(view.getFullYear(), view.getMonth())
  const todayStr = toDateStr(now)
  const isCurrentMonth =
    view.getFullYear() === now.getFullYear() && view.getMonth() === now.getMonth()
  const monthCount = cells.filter((d) => d && trainedSet.has(toDateStr(d))).length

  const monthLabel = view
    .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    .replace(/^\w/, (c) => c.toUpperCase())

  const shift = (delta) =>
    setView((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1))

  return (
    <section>
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => shift(-1)}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-100 hover:bg-ink-800 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <p className="display text-sm text-zinc-100">{monthLabel}</p>
            <p className="eyebrow mt-0.5">{monthCount} {monthCount === 1 ? 'día' : 'días'}</p>
          </div>
          <button
            onClick={() => shift(1)}
            disabled={isCurrentMonth}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-100 hover:bg-ink-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {DAY_LABELS.map((d) => (
            <span key={d} className="text-center text-[10px] text-zinc-600 font-medium">{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />
            const str = toDateStr(day)
            const trained = trainedSet.has(str)
            const isToday = str === todayStr
            return (
              <div
                key={i}
                className={`aspect-square rounded-lg flex items-center justify-center text-xs ${
                  trained
                    ? 'bg-accent text-ink-950 font-semibold'
                    : 'text-zinc-500'
                } ${isToday && !trained ? 'ring-1 ring-accent/50' : ''}`}
              >
                {trained ? <Flame size={13} fill="currentColor" /> : day.getDate()}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
