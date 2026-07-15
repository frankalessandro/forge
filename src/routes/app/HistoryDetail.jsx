import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Trophy, ChevronRight, Dumbbell, Clock, Weight, ListChecks, Users, Lock } from 'lucide-react'
import { sileo } from 'sileo'
import PageHeader from '../../components/ui/PageHeader'
import { calcVolume } from '../../utils/weight'
import { formatDuration, formatDay, formatHour } from '../../utils/duration'
import { bestSet, SET_TYPE_LABEL, SET_TYPE_COLOR } from '../../utils/workoutSets'
import { useSessionDetail } from '../../hooks/useSessionDetail'
import { logError } from '../../utils/logError'

export function SessionDetail({ title, back, sessionId, hero, cta, showVisibilityToggle = false }) {
  const navigate = useNavigate()
  const { data, loading, error, setPublic } = useSessionDetail(sessionId)
  const session = data?.session ?? null
  const groupedSets = data?.groupedSets ?? []
  const [togglingVisibility, setTogglingVisibility] = useState(false)

  const totalVolume = calcVolume(groupedSets.flatMap((g) => g.sets))

  async function handleToggleVisibility() {
    setTogglingVisibility(true)
    try {
      const next = !session.is_public
      await setPublic(next)
      sileo.success({ title: next ? 'Visible para tus amigos.' : 'Ahora es privado.' })
    } catch (err) {
      logError('SessionDetail.toggleVisibility', err)
      sileo.error({ title: 'No se pudo cambiar la visibilidad', description: err.message })
    } finally {
      setTogglingVisibility(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink-950">
      <PageHeader title={title} back={back} />

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-6">
        {loading && (
          <div className="animate-pulse space-y-4">
            <div className="h-36 card" />
            <div className="h-40 card" />
          </div>
        )}

        {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}

        {!loading && session && (
          <>
            {hero}

            {/* Hero con la fecha y los totales de la sesión */}
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-accent/20 to-accent/5 border border-accent/25 p-6">
              <div className="absolute -right-6 -bottom-8 opacity-20">
                <Dumbbell size={140} strokeWidth={1.5} className="text-accent" />
              </div>
              <p className="font-display uppercase tracking-[0.2em] text-xs font-semibold text-accent/80 capitalize">
                {formatDay(session.started_at)}
              </p>
              <p className="stat-num text-2xl text-zinc-100 mt-1">{formatHour(session.started_at)}</p>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div>
                  <p className="stat-num text-2xl text-zinc-100 flex items-center gap-1.5 leading-none">
                    <Clock size={16} className="text-zinc-500" />
                    {session.finished_at ? formatDuration(session.started_at, session.finished_at) : '—'}
                  </p>
                  <p className="eyebrow mt-1.5">Duración</p>
                </div>
                <div>
                  <p className="stat-num text-2xl text-accent flex items-center gap-1.5 leading-none">
                    <Weight size={16} />
                    {totalVolume > 0 ? totalVolume.toLocaleString('es') : '—'}
                  </p>
                  <p className="eyebrow mt-1.5">Volumen (kg)</p>
                </div>
                <div>
                  <p className="stat-num text-2xl text-zinc-100 flex items-center gap-1.5 leading-none">
                    <ListChecks size={16} className="text-zinc-500" />
                    {groupedSets.length}
                  </p>
                  <p className="eyebrow mt-1.5">Ejercicios</p>
                </div>
              </div>
            </div>

            {showVisibilityToggle && (
              <button
                type="button"
                onClick={handleToggleVisibility}
                disabled={togglingVisibility}
                className="w-full card flex items-center gap-3 px-4 py-3.5 text-left disabled:opacity-60"
              >
                <div className={`rounded-xl p-2 shrink-0 ${session.is_public ? 'bg-accent/15 text-accent' : 'bg-ink-800 text-zinc-500'}`}>
                  {session.is_public ? <Users size={18} /> : <Lock size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="display text-sm text-zinc-100">
                    {session.is_public ? 'Visible para tus amigos' : 'Solo tú lo ves'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">Toca para {session.is_public ? 'ocultarlo' : 'compartirlo'}</p>
                </div>
                <div className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${session.is_public ? 'bg-accent' : 'bg-ink-700'}`}>
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-ink-950 transition-transform ${session.is_public ? 'translate-x-5.5' : 'translate-x-0.5'}`}
                  />
                </div>
              </button>
            )}

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
                    <div key={group.exerciseId} className="card p-4">
                      <button
                        onClick={() => navigate(`/app/exercises/${group.exerciseId}`)}
                        className="flex items-center gap-3 w-full mb-3 text-left"
                      >
                        {group.imageUrl ? (
                          <img
                            src={group.imageUrl}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover bg-ink-900 shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-ink-900 flex items-center justify-center shrink-0">
                            <Dumbbell size={18} className="text-zinc-700" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="display text-sm text-zinc-100 truncate">{group.name}</h3>
                          {group.muscle && <p className="text-xs text-zinc-500 truncate mt-0.5">{group.muscle}</p>}
                        </div>
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
