import { useState, useEffect } from 'react'
import { Trophy, Lock } from 'lucide-react'
import { useAchievements } from '../../hooks/useAchievements'
import { rankForXp } from '../../utils/ranks'
import { iconFor } from '../../utils/achievementIcons'

function RankCard({ xp }) {
  const { current, next, progress } = rankForXp(xp)
  return (
    <div className={`border rounded-2xl p-5 ${current.bg}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow opacity-80">Rango</p>
          <p className={`font-display font-bold uppercase tracking-tight text-2xl leading-none mt-1 ${current.color}`}>
            {current.name}
          </p>
        </div>
        <div className="text-right">
          <p className="stat-num text-2xl text-zinc-100">{xp.toLocaleString('es-AR')}</p>
          <p className="eyebrow text-zinc-500">XP</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="h-1.5 bg-ink-800/80 rounded-full overflow-hidden">
          <div className="h-full bg-current rounded-full transition-all" style={{ width: `${progress * 100}%`, color: 'inherit' }} />
        </div>
        <p className="text-xs text-zinc-500 mt-1.5">
          {next ? `${(next.min - xp).toLocaleString('es-AR')} XP para ${next.name}` : 'Rango máximo alcanzado'}
        </p>
      </div>
    </div>
  )
}

function AchievementBadge({ achievement, unlocked, value }) {
  // achievement.Icon se resuelve al cargar (fuera del render) para no crear
  // componentes durante el render.
  const Icon = unlocked ? achievement.Icon : Lock
  const pct = Math.min(100, Math.round((value / Number(achievement.threshold)) * 100))
  return (
    <div className={`card p-3 ${unlocked ? 'border-accent/30' : 'opacity-70'}`}>
      <div className="flex items-center gap-2.5">
        <div className={`rounded-xl p-2 shrink-0 ${unlocked ? 'bg-accent/15 text-accent' : 'bg-ink-800 text-zinc-600'}`}>
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className={`display text-xs truncate ${unlocked ? 'text-zinc-100' : 'text-zinc-400'}`}>{achievement.name}</p>
          <p className="text-[11px] text-zinc-500 leading-tight">{achievement.description}</p>
        </div>
      </div>
      {!unlocked && (
        <div className="h-1 bg-ink-800 rounded-full overflow-hidden mt-2.5">
          <div className="h-full bg-zinc-600 rounded-full" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  )
}

export default function AchievementsPanel() {
  const { getCatalog, getUnlocked, getStats, checkAndUnlock, valueForCategory } = useAchievements()
  const [catalog, setCatalog] = useState([])
  const [unlocked, setUnlocked] = useState(new Set())
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        // Desbloquea retroactivamente lo que corresponda al abrir el perfil.
        await checkAndUnlock().catch(() => {})
        const [cat, unl, st] = await Promise.all([getCatalog(), getUnlocked(), getStats()])
        if (cancelled) return
        setCatalog(cat.map((a) => ({ ...a, Icon: iconFor(a.icon) })))
        setUnlocked(new Set(unl.map((u) => u.achievement_id)))
        setStats(st)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [checkAndUnlock, getCatalog, getUnlocked, getStats])

  if (loading) {
    return (
      <div className="space-y-3">
        <h2 className="section-title">Logros</h2>
        <div className="h-28 card animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 card animate-pulse" />)}
        </div>
      </div>
    )
  }

  const xp = catalog.filter((a) => unlocked.has(a.id)).reduce((sum, a) => sum + (a.xp ?? 0), 0)
  const unlockedCount = catalog.filter((a) => unlocked.has(a.id)).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title flex items-center gap-2">
          <Trophy size={16} className="text-accent" />
          Logros y rango
        </h2>
        <span className="eyebrow text-zinc-500">{unlockedCount}/{catalog.length}</span>
      </div>

      <RankCard xp={xp} />

      <div className="grid grid-cols-2 gap-3">
        {catalog.map((a) => (
          <AchievementBadge
            key={a.id}
            achievement={a}
            unlocked={unlocked.has(a.id)}
            value={stats ? valueForCategory(a.category, stats) : 0}
          />
        ))}
      </div>
    </div>
  )
}
