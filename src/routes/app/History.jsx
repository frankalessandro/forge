import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Dumbbell, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'

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
  return sets
    .filter((s) => s.set_type !== 'warmup')
    .reduce((acc, s) => acc + (s.reps ?? 0) * (s.weight_kg ?? 0), 0)
}

function formatTime(isoStr) {
  const d = new Date(isoStr)
  return d.toLocaleDateString('es-AR') + ' ' + d.toTimeString().slice(0, 5)
}

export default function History() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [sessionStats, setSessionStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    load(page)
  }, [page])

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
    const page_sessions = data.slice(0, PAGE_SIZE)
    setSessions(page_sessions)

    const stats = {}
    await Promise.all(
      page_sessions.map(async (sess) => {
        const { data: sets } = await supabase
          .from('workout_sets')
          .select('exercise_id, reps, weight_kg, set_type')
          .eq('session_id', sess.id)

        if (sets) {
          const exerciseIds = new Set(sets.map((s) => s.exercise_id))
          stats[sess.id] = {
            volume: calcVolume(sets),
            exerciseCount: exerciseIds.size,
          }
        }
      })
    )
    setSessionStats(stats)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/app/dashboard')}
            className="text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Historial</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-3">
        {loading && (
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl" />
            ))}
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <Dumbbell size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="font-medium text-gray-500">No hay entrenamientos registrados</p>
            <p className="text-sm mt-1">Completá tu primer sesión para verla aquí</p>
          </div>
        )}

        {!loading && sessions.map((sess) => {
          const stats = sessionStats[sess.id]
          return (
            <button
              key={sess.id}
              onClick={() => navigate(`/app/history/${sess.id}`)}
              className="w-full bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-gray-400 transition-colors"
            >
              <p className="font-semibold text-gray-900 text-sm">{formatTime(sess.started_at)}</p>
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span>{formatDuration(sess.started_at, sess.finished_at)}</span>
                {stats && (
                  <>
                    <span>{stats.exerciseCount} ejercicio{stats.exerciseCount !== 1 ? 's' : ''}</span>
                    <span>{stats.volume > 0 ? `${stats.volume.toLocaleString('es-AR')} kg` : '—'}</span>
                  </>
                )}
              </div>
            </button>
          )
        })}

        {!loading && sessions.length > 0 && (
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={16} />
              Anterior
            </button>
            <span className="text-sm text-gray-400">Página {page + 1}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 transition-colors"
            >
              Siguiente
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
