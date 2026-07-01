import { useParams, useNavigate } from 'react-router-dom'
import { Trophy, ChevronRight } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import Stat from '../../components/ui/Stat'
import { calcVolume } from '../../utils/weight'
import { formatDuration } from '../../utils/duration'
import { bestSet, SET_TYPE_LABEL, SET_TYPE_COLOR } from '../../utils/workoutSets'
import { useSessionDetail } from '../../hooks/useSessionDetail'

export function SessionDetail({ title, back, sessionId, hero, cta }) {
  const navigate = useNavigate()
  const { data, loading, error } = useSessionDetail(sessionId)
  const session = data?.session ?? null
  const groupedSets = data?.groupedSets ?? []

  const totalVolume = calcVolume(groupedSets.flatMap((g) => g.sets))

  return (
    <div className="min-h-screen bg-ink-950">
      <PageHeader title={title} back={back} />

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-6">
        {loading && (
          <div className="animate-pulse space-y-4">
            <div className="h-24 card" />
            <div className="h-40 card" />
          </div>
        )}

        {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}

        {!loading && session && (
          <>
            {hero}
            <div className="grid grid-cols-2 gap-3">
              <Stat
                value={session.finished_at ? formatDuration(session.started_at, session.finished_at) : '—'}
                label="Duración"
              />
              <Stat
                value={totalVolume > 0 ? totalVolume.toLocaleString('es') : '—'}
                suffix={totalVolume > 0 ? 'kg' : ''}
                label="Volumen"
                variant="accent"
              />
            </div>

            {session.notes && (
              <div className="card p-4">
                <p className="section-title mb-2">Notas</p>
                <p className="text-sm text-zinc-300">{session.notes}</p>
              </div>
            )}

            {groupedSets.length > 0 && (
              <div className="space-y-3">
                <h2 className="section-title">Ejercicios</h2>
                {groupedSets.map((group) => {
                  const best = bestSet(group.sets)
                  return (
                    <div key={group.name} className="card p-4">
                      <button
                        onClick={() => navigate(`/app/exercises/${group.exerciseId}`)}
                        className="flex items-center justify-between w-full mb-3 text-left"
                      >
                        <h3 className="display text-sm text-zinc-100">{group.name}</h3>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="eyebrow">{group.sets.length} {group.sets.length === 1 ? 'serie' : 'series'}</span>
                          <ChevronRight size={14} className="text-zinc-600" />
                        </div>
                      </button>

                      <div className="space-y-1 mb-1">
                        {group.sets.map((s, i) => {
                          const typeLabel = SET_TYPE_LABEL[s.set_type]
                          const typeColor = SET_TYPE_COLOR[s.set_type] ?? ''
                          return (
                            <div key={s.id} className="flex items-center gap-3 text-sm">
                              <span className="w-5 text-center stat-num text-xs text-zinc-600 shrink-0">{i + 1}</span>
                              <span className="text-zinc-200 font-medium tabular-nums">{s.weight_kg ?? 0} kg × {s.reps ?? 0}</span>
                              {typeLabel && <span className={`text-xs ${typeColor}`}>{typeLabel}</span>}
                            </div>
                          )
                        })}
                      </div>

                      {best && (
                        <div className="flex items-center gap-1.5 pt-2 mt-2 border-t border-ink-800">
                          <Trophy size={12} className="text-accent" />
                          <p className="text-xs text-accent font-medium tabular-nums">Mejor: {best.weight_kg} kg × {best.reps}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {cta}
          </>
        )}
      </main>
    </div>
  )
}

export default function HistoryDetail() {
  const { sessionId } = useParams()
  return <SessionDetail title="Entrenamiento" back="/app/history" sessionId={sessionId} />
}
