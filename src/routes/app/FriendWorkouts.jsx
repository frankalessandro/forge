import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Dumbbell } from 'lucide-react'
import { useFriends } from '../../hooks/useFriends'
import PageHeader from '../../components/ui/PageHeader'
import Metric from '../../components/ui/Metric'
import { formatDuration, formatDay, formatHour } from '../../utils/duration'
import { logError } from '../../utils/logError'

export default function FriendWorkouts() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { getFriendWorkouts, getFriendProfile } = useFriends()

  const [sessions, setSessions] = useState([])
  const [friendName, setFriendName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [workouts, profile] = await Promise.all([
          getFriendWorkouts(userId),
          getFriendProfile(userId),
        ])
        if (cancelled) return
        setSessions(workouts)
        setFriendName(profile?.name ?? '')
      } catch (err) {
        if (!cancelled) { logError('FriendWorkouts.load', err); setError(err.message) }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [userId, getFriendWorkouts, getFriendProfile])

  return (
    <div className="min-h-screen bg-ink-950">
      <PageHeader title={friendName ? `Historial de ${friendName}` : 'Historial'} back={`/app/u/${userId}`} />

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-3">
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
        )}

        {loading && (
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-[88px] card" />)}
          </div>
        )}

        {!loading && sessions.length === 0 && !error && (
          <div className="text-center py-20 text-zinc-500">
            <Dumbbell size={40} className="mx-auto mb-3 text-zinc-700" />
            <p className="display text-sm text-zinc-400">Sin entrenamientos registrados</p>
          </div>
        )}

        {!loading && sessions.map((sess) => (
          <button
            key={sess.id}
            onClick={() => navigate(`/app/u/${userId}/workouts/${sess.id}`)}
            className="w-full card card-hover p-4 text-left"
          >
            <div className="flex items-center justify-between">
              <p className="display text-sm text-zinc-100 capitalize">{formatDay(sess.started_at)}</p>
              <span className="text-xs text-zinc-600 tabular-nums">{formatHour(sess.started_at)}</span>
            </div>
            <div className="flex gap-5 mt-2.5">
              <Metric value={formatDuration(sess.started_at, sess.finished_at)} label="dur" />
              {Number(sess.exercise_count) > 0 && (
                <Metric value={sess.exercise_count} label="ejerc" />
              )}
              {Number(sess.volume) > 0 && (
                <Metric value={Number(sess.volume).toLocaleString('es')} label="kg" />
              )}
            </div>
          </button>
        ))}
      </main>
    </div>
  )
}
