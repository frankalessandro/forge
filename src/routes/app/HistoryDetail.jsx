import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, TrendingUp, Trophy } from 'lucide-react'
import { supabase } from '../../lib/supabase'

function formatDuration(startedAt, finishedAt) {
  const ms = new Date(finishedAt) - new Date(startedAt)
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function calcVolume(sets) {
  return sets
    .filter((s) => s.set_type !== 'warmup')
    .reduce((acc, s) => acc + (s.reps ?? 0) * (s.weight_kg ?? 0), 0)
}

function bestSet(sets) {
  const working = sets.filter((s) => s.set_type !== 'warmup' && (s.weight_kg ?? 0) > 0)
  if (!working.length) return null
  return working.reduce((best, s) => ((s.weight_kg ?? 0) > (best.weight_kg ?? 0) ? s : best))
}

const SET_TYPE_LABEL = {
  normal: null,
  warmup: 'Calent.',
  dropset: 'Dropset',
  failure: 'Fallo',
}

const SET_TYPE_COLOR = {
  warmup: 'text-amber-600',
  dropset: 'text-purple-600',
  failure: 'text-red-600',
}

export default function HistoryDetail() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [groupedSets, setGroupedSets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!sessionId) return
    async function load() {
      const { data: sess, error: sessErr } = await supabase
        .from('workout_sessions')
        .select('id, started_at, finished_at, notes')
        .eq('id', sessionId)
        .single()

      if (sessErr) { setError(sessErr.message); setLoading(false); return }

      const { data: sets, error: setsErr } = await supabase
        .from('workout_sets')
        .select('id, exercise_id, set_number, reps, weight_kg, set_type, completed_at, exercises(name)')
        .eq('session_id', sessionId)
        .order('set_number')

      if (setsErr) { setError(setsErr.message); setLoading(false); return }

      const map = new Map()
      for (const s of sets ?? []) {
        const name = s.exercises?.name ?? 'Ejercicio'
        if (!map.has(s.exercise_id)) map.set(s.exercise_id, { name, sets: [] })
        map.get(s.exercise_id).sets.push(s)
      }

      setSession(sess)
      setGroupedSets([...map.values()])
      setLoading(false)
    }
    load()
  }, [sessionId])

  const allSets = groupedSets.flatMap((g) => g.sets)
  const totalVolume = calcVolume(allSets)

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/app/history')}
            className="text-gray-500 hover:text-gray-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-100">Detalle del entrenamiento</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {loading && (
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-gray-800 rounded-xl" />
            <div className="h-40 bg-gray-800 rounded-xl" />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
        )}

        {!loading && session && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Clock size={16} />
                  <span className="text-xs font-medium uppercase tracking-wide">Duración</span>
                </div>
                <p className="text-xl font-bold text-gray-100">
                  {session.finished_at ? formatDuration(session.started_at, session.finished_at) : '—'}
                </p>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <TrendingUp size={16} />
                  <span className="text-xs font-medium uppercase tracking-wide">Volumen</span>
                </div>
                <p className="text-xl font-bold text-gray-100">
                  {totalVolume > 0 ? `${totalVolume.toLocaleString('es-AR')} kg` : '—'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">sin calentamiento</p>
              </div>
            </div>

            {session.notes && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Notas</p>
                <p className="text-sm text-gray-300">{session.notes}</p>
              </div>
            )}

            {groupedSets.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-semibold text-gray-100">Ejercicios</h2>
                {groupedSets.map((group) => {
                  const best = bestSet(group.sets)
                  return (
                    <div key={group.name} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-medium text-gray-100">{group.name}</h3>
                        <span className="text-xs text-gray-500">
                          {group.sets.length} {group.sets.length === 1 ? 'serie' : 'series'}
                        </span>
                      </div>

                      <div className="space-y-1 mb-3">
                        {group.sets.map((s, i) => {
                          const typeLabel = SET_TYPE_LABEL[s.set_type]
                          const typeColor = SET_TYPE_COLOR[s.set_type] ?? ''
                          return (
                            <div key={s.id} className="flex items-center gap-3 text-sm">
                              <span className="w-5 text-center text-gray-500 text-xs shrink-0">{i + 1}</span>
                              <span className="text-gray-300 font-medium">
                                {s.weight_kg ?? 0} kg × {s.reps ?? 0} reps
                              </span>
                              {typeLabel && (
                                <span className={`text-xs ${typeColor}`}>{typeLabel}</span>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {best && (
                        <div className="flex items-center gap-1 pt-2 border-t border-gray-800">
                          <Trophy size={11} className="text-amber-500" />
                          <p className="text-xs text-amber-600 font-medium">
                            Mejor: {best.weight_kg} kg × {best.reps} reps
                          </p>
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
