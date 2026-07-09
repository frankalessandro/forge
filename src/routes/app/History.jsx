import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dumbbell, ChevronLeft, ChevronRight } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Metric from '../../components/ui/Metric'
import { formatDuration, formatDay, formatHour } from '../../utils/duration'
import { useHistory } from '../../hooks/useHistory'
import TutorialGuide from '../../components/features/TutorialGuide'

export default function History() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const { data, loading, error } = useHistory(page)
  const { sessions, sessionStats, hasMore } = data

  return (
    <div className="min-h-screen bg-ink-950">
      <TutorialGuide module="history" />
      <PageHeader title="Progreso" back="/app/dashboard" />

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-3">
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
        )}

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

        {!loading && sessions.map((sess, i) => {
          const stats = sessionStats[sess.id]
          return (
            <button
              key={sess.id}
              onClick={() => navigate(`/app/history/${sess.id}`)}
              data-tutorial={i === 0 ? 'history-session' : undefined}
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
