import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Dumbbell, TrendingUp } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

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

function formatVolume(sets) {
  const total = sets.reduce((acc, s) => acc + (s.reps ?? 0) * (s.weight_kg ?? 0), 0)
  return `${total.toLocaleString('es-AR')} kg`
}

export default function Summary() {
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

      // Group sets by exercise
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/app/dashboard', { replace: true })}
            className="text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Resumen del entrenamiento</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {loading && (
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-gray-200 rounded-xl" />
            <div className="h-40 bg-gray-200 rounded-xl" />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {!loading && session && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Clock size={16} />
                  <span className="text-xs font-medium uppercase tracking-wide">Duración</span>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {session.finished_at
                    ? formatDuration(session.started_at, session.finished_at)
                    : '—'}
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <TrendingUp size={16} />
                  <span className="text-xs font-medium uppercase tracking-wide">Volumen total</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{formatVolume(allSets)}</p>
              </div>
            </div>

            {/* Exercises */}
            {groupedSets.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Dumbbell size={36} className="mx-auto mb-2 text-gray-200" />
                <p className="font-medium text-gray-500">No se registraron series</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="font-semibold text-gray-900">Ejercicios</h2>
                {groupedSets.map((group) => (
                  <div key={group.name} className="bg-white border border-gray-200 rounded-xl p-4">
                    <h3 className="font-medium text-gray-900 mb-3">{group.name}</h3>
                    <div className="space-y-1">
                      {group.sets.map((s, i) => (
                        <div key={s.id} className="flex items-center gap-3 text-sm">
                          <span className="w-5 text-center text-gray-400 text-xs">{i + 1}</span>
                          <span className="text-gray-700 font-medium">
                            {s.weight_kg ?? 0} kg × {s.reps ?? 0} reps
                          </span>
                          {s.set_type !== 'normal' && (
                            <span className="text-xs text-gray-400 capitalize">{s.set_type}</span>
                          )}
                          {s.completed_at && (
                            <span className="ml-auto text-green-500 text-xs">✓</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
                      Volumen: {formatVolume(group.sets)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            {session.notes && (
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Notas</p>
                <p className="text-sm text-gray-700">{session.notes}</p>
              </div>
            )}

            <button
              onClick={() => navigate('/app/dashboard', { replace: true })}
              className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-semibold hover:bg-gray-800 transition-colors"
            >
              Volver al inicio
            </button>
          </>
        )}
      </main>
    </div>
  )
}
