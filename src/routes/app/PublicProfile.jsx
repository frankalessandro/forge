import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Flame, Dumbbell, Layers, Trophy, Lock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useFriends } from '../../hooks/useFriends'
import { rankForXp } from '../../utils/ranks'
import PageHeader from '../../components/ui/PageHeader'

const GOAL_LABELS = {
  lose_fat: 'Perder grasa',
  gain_muscle: 'Ganar músculo',
  strength: 'Fuerza',
  endurance: 'Resistencia',
  health: 'Salud general',
}

// Una fila de comparación amigo vs. yo. Resalta a quien va por delante.
function CompareRow({ icon: Icon, label, mine, theirs, unit, format = (v) => v }) {
  const mineWins = mine > theirs
  const theirsWins = theirs > mine
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-ink-800 last:border-0">
      <span className={`stat-num text-base w-24 text-right ${theirsWins ? 'text-accent' : 'text-zinc-100'}`}>
        {format(theirs)}{unit && <span className="text-xs text-zinc-500 ml-0.5">{unit}</span>}
      </span>
      <span className="flex items-center gap-1.5 flex-1 justify-center text-zinc-500 text-xs">
        <Icon size={13} /> {label}
      </span>
      <span className={`stat-num text-base w-24 ${mineWins ? 'text-accent' : 'text-zinc-100'}`}>
        {format(mine)}{unit && <span className="text-xs text-zinc-500 ml-0.5">{unit}</span>}
      </span>
    </div>
  )
}

function formatVolume(kg) {
  return kg >= 1000 ? `${(kg / 1000).toFixed(1)}t` : `${Math.round(kg)}`
}

export default function PublicProfile() {
  const { userId } = useParams()
  const { getFriendProfile } = useFriends()
  const [friend, setFriend] = useState(null)
  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        const [theirs, mine] = await Promise.all([
          getFriendProfile(userId),
          getFriendProfile(user.id),
        ])
        if (cancelled) return
        if (!theirs) { setDenied(true); return }
        setFriend(theirs)
        setMe(mine)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [userId, getFriendProfile])

  const friendRank = friend ? rankForXp(friend.xp) : null

  return (
    <div className="min-h-screen bg-ink-950">
      <PageHeader title="Perfil" back="/app/friends" />

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-6">
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
        )}

        {loading && (
          <div className="animate-pulse space-y-4">
            <div className="h-24 card" />
            <div className="h-48 card" />
          </div>
        )}

        {denied && !loading && (
          <div className="card border-dashed px-6 py-12 text-center">
            <Lock size={32} className="mx-auto text-zinc-600 mb-3" />
            <p className="display text-sm text-zinc-300">Perfil privado</p>
            <p className="text-sm text-zinc-500 mt-1">Solo puedes ver el progreso de tus amigos. Agrégalo para comparar.</p>
          </div>
        )}

        {friend && !loading && (
          <>
            {/* Cabecera */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-accent/15 text-accent flex items-center justify-center shrink-0 font-display font-bold text-2xl">
                {friend.name ? friend.name[0].toUpperCase() : '?'}
              </div>
              <div className="min-w-0">
                <p className="font-display font-bold uppercase tracking-tight text-xl text-zinc-100 leading-none truncate">
                  {friend.name || 'Atleta'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`chip ${friendRank.current.bg} ${friendRank.current.color}`}>{friendRank.current.name}</span>
                  {friend.goal && <span className="chip-muted">{GOAL_LABELS[friend.goal] ?? friend.goal}</span>}
                </div>
              </div>
            </div>

            {/* Stats del amigo */}
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-4">
                <p className="stat-num text-2xl text-accent">{friend.streak}</p>
                <p className="eyebrow mt-1">Racha</p>
              </div>
              <div className="card p-4">
                <p className="stat-num text-2xl text-zinc-100">{friend.total_workouts}</p>
                <p className="eyebrow mt-1">Entrenos</p>
              </div>
              <div className="card p-4">
                <p className="stat-num text-2xl text-zinc-100">{friend.achievements_count}</p>
                <p className="eyebrow mt-1">Logros</p>
              </div>
            </div>

            {/* Comparación */}
            {me && (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="eyebrow text-zinc-500 w-24 text-right truncate">{friend.name}</span>
                  <h2 className="section-title">Comparación</h2>
                  <span className="eyebrow text-accent w-24 truncate">Tú</span>
                </div>
                <CompareRow icon={Flame} label="Racha" mine={me.streak} theirs={friend.streak} />
                <CompareRow icon={Dumbbell} label="Entrenos" mine={me.total_workouts} theirs={friend.total_workouts} />
                <CompareRow icon={Layers} label="Volumen" mine={Number(me.total_volume)} theirs={Number(friend.total_volume)} unit="" format={formatVolume} />
                <CompareRow icon={Trophy} label="XP" mine={me.xp} theirs={friend.xp} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
