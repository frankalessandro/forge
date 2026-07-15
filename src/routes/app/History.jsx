import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dumbbell, ChevronLeft, ChevronRight, Flame, TrendingUp, Trophy, Play } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Metric from '../../components/ui/Metric'
import ExerciseThumbs from '../../components/ui/ExerciseThumbs'
import { formatDuration, formatDay, formatHour } from '../../utils/duration'
import { useHistory } from '../../hooks/useHistory'
import { useAchievements } from '../../hooks/useAchievements'
import { logError } from '../../utils/logError'
import TutorialGuide from '../../components/features/TutorialGuide'

export default function History() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const { data, loading, error } = useHistory(page)
  const { sessions, sessionStats, hasMore } = data
  const { getStats } = useAchievements()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let cancelled = false
    getStats()
      .then((s) => { if (!cancelled) setStats(s) })
      .catch((err) => logError('History.getStats', err))
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-ink-950">
      <TutorialGuide module="history" />
      <PageHeader title="Progreso" back="/app/dashboard" />

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-6">
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
        )}

        {/* Resumen histórico */}
        {stats ? (
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-accent/20 to-accent/5 border border-accent/25 p-6">
            <div className="absolute -right-6 -bottom-8 opacity-20">
              <TrendingUp size={140} strokeWidth={1.5} className="text-accent" />
            </div>
            <p className="font-display uppercase tracking-[0.2em] text-xs font-semibold text-accent/80">
              Tu progreso
            </p>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div>
                <p className="stat-num text-3xl text-zinc-100 leading-none">{stats.totalWorkouts}</p>
                <p className="eyebrow mt-1.5">Entrenos</p>
              </div>
              <div>
                <p className="stat-num text-3xl text-zinc-100 leading-none">
                  {stats.totalVolume >= 1000 ? `${(stats.totalVolume / 1000).toFixed(1)}t` : Math.round(stats.totalVolume)}
                </p>
                <p className="eyebrow mt-1.5">Volumen</p>
              </div>
              <div>
                <p className="stat-num text-3xl text-accent leading-none flex items-center gap-1">
                  <Flame size={20} fill="currentColor" />
                  {stats.currentStreak}
                </p>
                <p className="eyebrow mt-1.5">Racha</p>
              </div>
            </div>
            {stats.totalPRs > 0 && (
              <p className="text-xs text-zinc-400 mt-4 flex items-center gap-1.5">
                <Trophy size={13} className="text-accent" />
                <span className="text-zinc-100 font-medium">{stats.totalPRs}</span> récords personales conseguidos
              </p>
            )}
          </div>
        ) : (
          <div className="h-[168px] card animate-pulse" />
        )}

        {loading && (
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-[92px] card" />)}
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="text-center py-16 text-zinc-500">
            <Dumbbell size={40} className="mx-auto mb-3 text-zinc-700" />
            <p className="display text-sm text-zinc-400">No hay entrenamientos registrados</p>
            <p className="text-sm mt-1 text-zinc-600">Completa tu primera sesión para verla aquí</p>
            <button onClick={() => navigate('/app/workout/start')} className="btn-accent mt-5 px-5 py-2.5 text-sm mx-auto">
              <Play size={15} fill="currentColor" />
              Empezar a entrenar
            </button>
          </div>
        )}

        {!loading && sessions.length > 0 && (
          <div className="space-y-3">
            {sessions.map((sess, i) => {
              const stat = sessionStats[sess.id]
              const extraThumbs = stat ? Math.max(0, stat.exerciseCount - (stat.thumbs?.length ?? 0)) : 0
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
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex gap-5">
                      <Metric value={formatDuration(sess.started_at, sess.finished_at)} label="dur" />
                      {stat && (
                        <>
                          <Metric value={stat.exerciseCount} label="ejerc" />
                          <Metric value={stat.volume > 0 ? `${stat.volume.toLocaleString('es')}` : '—'} label="kg" />
                        </>
                      )}
                    </div>
                    <ExerciseThumbs thumbs={stat?.thumbs} extra={extraThumbs} />
                  </div>
                </button>
              )
            })}
          </div>
        )}

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
