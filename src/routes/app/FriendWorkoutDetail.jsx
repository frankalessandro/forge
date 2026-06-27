import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import { useFriends } from '../../hooks/useFriends'
import PageHeader from '../../components/ui/PageHeader'
import Stat from '../../components/ui/Stat'

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
  return sets.filter((s) => s.set_type !== 'warmup').reduce((acc, s) => acc + (s.reps ?? 0) * (s.weight_kg ?? 0), 0)
}

function bestSet(sets) {
  const working = sets.filter((s) => s.set_type !== 'warmup' && (s.weight_kg ?? 0) > 0)
  if (!working.length) return null
  return working.reduce((best, s) => ((s.weight_kg ?? 0) > (best.weight_kg ?? 0) ? s : best))
}

const SET_TYPE_LABEL = { normal: null, warmup: 'Calent.', dropset: 'Dropset', failure: 'Fallo' }
const SET_TYPE_COLOR = { warmup: 'text-amber-300', dropset: 'text-fuchsia-300', failure: 'text-red-300' }

export default function FriendWorkoutDetail() {
  const { userId, sessionId } = useParams()
  const { getFriendSessionSets } = useFriends()

  const [session, setSession] = useState(null)
  const [groupedSets, setGroupedSets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const rows = await getFriendSessionSets(userId, sessionId)
        if (cancelled) return

        if (!rows.length) {
          setLoading(false)
          return
        }

        const first = rows[0]
        setSession({
          started_at: first.started_at,
          finished_at: first.finished_at,
          notes: first.notes,
        })

        const map = new Map()
        for (const r of rows) {
          if (!map.has(r.exercise_id)) map.set(r.exercise_id, { name: r.exercise_name, sets: [] })
          map.get(r.exercise_id).sets.push(r)
        }
        setGroupedSets([...map.values()])
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [userId, sessionId, getFriendSessionSets])

  const totalVolume = calcVolume(groupedSets.flatMap((g) => g.sets))

  return (
    <div className="min-h-screen bg-ink-950">
      <PageHeader title="Entrenamiento" back={`/app/u/${userId}/workouts`} />

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-6">
        {loading && (
          <div className="animate-pulse space-y-4">
            <div className="h-24 card" />
            <div className="h-40 card" />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
        )}

        {!loading && session && (
          <>
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
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="display text-sm text-zinc-100">{group.name}</h3>
                        <span className="eyebrow">{group.sets.length} {group.sets.length === 1 ? 'serie' : 'series'}</span>
                      </div>

                      <div className="space-y-1 mb-1">
                        {group.sets.map((s, i) => {
                          const typeLabel = SET_TYPE_LABEL[s.set_type]
                          const typeColor = SET_TYPE_COLOR[s.set_type] ?? ''
                          return (
                            <div key={s.set_id} className="flex items-center gap-3 text-sm">
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
          </>
        )}
      </main>
    </div>
  )
}
