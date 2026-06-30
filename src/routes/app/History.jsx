import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dumbbell, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import PageHeader from '../../components/ui/PageHeader'
import { displayWeight } from '../../utils/weight'

const PAGE_SIZE = 10

function formatDuration(startedAt, finishedAt) {
  const ms = new Date(finishedAt) - new Date(startedAt)
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function calcVolume(sets) {
  return sets.filter((s) => s.set_type !== 'warmup').reduce((acc, s) => acc + (s.reps ?? 0) * displayWeight(s.weight_kg, s.exercises?.equipment), 0)
}

function formatDay(isoStr) {
  const d = new Date(isoStr)
  return d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatHour(isoStr) {
  return new Date(isoStr).toTimeString().slice(0, 5)
}

export default function History() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [sessionStats, setSessionStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    async function load(p) {
      setLoading(true)
      const from = p * PAGE_SIZE
      const to = from + PAGE_SIZE

      const { data, error } = await supabase
        .from('workout_sessions')
        .select('id, started_at, finished_at, notes')
        .not('finished_at', 'is', null)
        .order('started_at', { ascending: false })
        .range(from, to)

      if (error || !data) { setLoading(false); return }

      setHasMore(data.length > PAGE_SIZE)
      const pageSessions = data.slice(0, PAGE_SIZE)
      setSessions(pageSessions)

      // Una sola query para todas las series de la página (evita N+1 round-trips).
      const ids = pageSessions.map((s) => s.id)
      const stats = {}
      if (ids.length > 0) {
        const { data: allSets } = await supabase
          .from('workout_sets')
          .select('session_id, exercise_id, reps, weight_kg, set_type, exercises(equipment)')
          .in('session_id', ids)

        const bySession = new Map()
        for (const set of allSets ?? []) {
          let entry = bySession.get(set.session_id)
          if (!entry) { entry = []; bySession.set(set.session_id, entry) }
          entry.push(set)
        }
        for (const [sessionId, sets] of bySession) {
          const exerciseIds = new Set(sets.map((s) => s.exercise_id))
          stats[sessionId] = { volume: calcVolume(sets), exerciseCount: exerciseIds.size }
        }
      }
      setSessionStats(stats)
      setLoading(false)
    }
    load(page)
  }, [page])

  return (
    <div className="min-h-screen bg-ink-950">
      <PageHeader title="Progreso" back="/app/dashboard" />

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-3">
        {loading && (
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-[88px] card" />)}
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="text-center py-20 text-zinc-500">
            <Dumbbell size={40} className="mx-auto mb-3 text-zinc-700" />
            <p className="display text-sm text-zinc-400">No hay entrenamientos registrados</p>
            <p className="text-sm mt-1 text-zinc-600">Completa tu primera sesión para verla aquí</p>
          </div>
        )}

        {!loading && sessions.map((sess) => {
          const stats = sessionStats[sess.id]
          return (
            <button
              key={sess.id}
              onClick={() => navigate(`/app/history/${sess.id}`)}
              className="w-full card card-hover p-4 text-left"
            >
              <div className="flex items-center justify-between">
                <p className="display text-sm text-zinc-100 capitalize">{formatDay(sess.started_at)}</p>
                <span className="text-xs text-zinc-600 tabular-nums">{formatHour(sess.started_at)}</span>
              </div>
              <div className="flex gap-5 mt-2.5">
                <Metric value={formatDuration(sess.started_at, sess.finished_at)} label="dur" />
                {stats && (
                  <>
                    <Metric value={stats.exerciseCount} label="ejerc" />
                    <Metric value={stats.volume > 0 ? `${stats.volume.toLocaleString('es')}` : '—'} label="kg" />
                  </>
                )}
              </div>
            </button>
          )
        })}

        {!loading && sessions.length > 0 && (
          <div className="flex justify-between items-center pt-2">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-100 disabled:opacity-30 transition-colors">
              <ChevronLeft size={16} />
              Anterior
            </button>
            <span className="eyebrow">Página {page + 1}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={!hasMore} className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-100 disabled:opacity-30 transition-colors">
              Siguiente
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

function Metric({ value, label }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="stat-num text-base text-zinc-100">{value}</span>
      <span className="eyebrow">{label}</span>
    </div>
  )
}
