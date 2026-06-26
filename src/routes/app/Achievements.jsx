import { useState, useEffect } from 'react'
import { Lock } from 'lucide-react'
import { useAchievements } from '../../hooks/useAchievements'
import { iconFor } from '../../utils/achievementIcons'
import PageHeader from '../../components/ui/PageHeader'
import RankCard from '../../components/features/RankCard'

function AchievementBadge({ achievement, unlocked, value }) {
  const Icon = unlocked ? achievement.Icon : Lock
  const pct = Math.min(100, Math.round((value / Number(achievement.threshold)) * 100))
  return (
    <div className={`p-3 ${unlocked ? '' : 'opacity-60'}`}>
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

export default function Achievements() {
  const { getCatalog, getUnlocked, getStats, checkAndUnlock, valueForCategory } = useAchievements()
  const [catalog, setCatalog] = useState([])
  const [unlocked, setUnlocked] = useState(new Set())
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        // Desbloquea retroactivamente lo que corresponda al abrir la vista.
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

  const xp = catalog.filter((a) => unlocked.has(a.id)).reduce((sum, a) => sum + (a.xp ?? 0), 0)
  const unlockedCount = catalog.filter((a) => unlocked.has(a.id)).length

  return (
    <div className="min-h-screen bg-ink-950">
      <PageHeader title="Rango y logros" back="/app/profile" />

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-4">
        {loading ? (
          <div className="space-y-4">
            <div className="h-28 card animate-pulse" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 card animate-pulse" />)}
            </div>
          </div>
        ) : (
          <>
            <RankCard xp={xp} />

            <div className="rounded-2xl overflow-hidden border border-ink-800 bg-ink-900">
              <div className="flex items-center justify-between px-4 py-3 border-b border-ink-800">
                <p className="display text-xs text-zinc-400 uppercase tracking-wider">Logros</p>
                <span className="eyebrow text-zinc-500">{unlockedCount}/{catalog.length}</span>
              </div>
              <div className="grid grid-cols-2 gap-px bg-ink-800">
                {catalog.map((a) => (
                  <div key={a.id} className="bg-ink-900">
                    <AchievementBadge
                      achievement={a}
                      unlocked={unlocked.has(a.id)}
                      value={stats ? valueForCategory(a.category, stats) : 0}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
