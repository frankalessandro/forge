import { useState, useEffect } from 'react'
import { Lock } from 'lucide-react'
import { useAchievements, valueForCategory } from '../../hooks/useAchievements'
import { iconFor, CATEGORY_LABELS } from '../../utils/achievementIcons'
import PageHeader from '../../components/ui/PageHeader'
import RankCard from '../../components/features/RankCard'
import AchievementModal from '../../components/features/AchievementModal'

const CATEGORY_ORDER = ['streak', 'workouts', 'volume', 'strength', 'bench', 'squat', 'deadlift', 'prs']

function AchievementBadge({ achievement, unlocked, value, onClick }) {
  const Icon = unlocked ? achievement.Icon : Lock
  const pct = Math.min(100, Number(achievement.threshold) > 0
    ? Math.round((value / Number(achievement.threshold)) * 100)
    : 0)

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 transition-colors hover:bg-ink-800/60 active:scale-[0.98] ${
        unlocked ? '' : 'opacity-60'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className={`rounded-xl p-2 shrink-0 ${
          unlocked ? 'bg-accent/15 text-accent' : 'bg-ink-800 text-zinc-600'
        }`}>
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className={`display text-xs truncate ${unlocked ? 'text-zinc-100' : 'text-zinc-400'}`}>
            {achievement.name}
          </p>
          <p className="text-[10px] text-zinc-500">{achievement.xp} XP</p>
        </div>
      </div>
      {!unlocked && (
        <div className="h-1 bg-ink-800 rounded-full overflow-hidden mt-2.5">
          <div className="h-full bg-zinc-600 rounded-full" style={{ width: `${pct}%` }} />
        </div>
      )}
    </button>
  )
}

export default function Achievements() {
  const { getCatalog, getUnlocked, getStats, checkAndUnlock } = useAchievements()
  const [catalog, setCatalog] = useState([])
  const [unlocked, setUnlocked] = useState(new Map()) // id → unlocked_at
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        await checkAndUnlock().catch(() => {})
        const [cat, unl, st] = await Promise.all([getCatalog(), getUnlocked(), getStats()])
        if (cancelled) return
        setCatalog(cat.map((a) => ({ ...a, Icon: iconFor(a.icon) })))
        setUnlocked(new Map(unl.map((u) => [u.achievement_id, u.unlocked_at])))
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

  const grouped = CATEGORY_ORDER
    .map((cat) => ({
      cat,
      label: CATEGORY_LABELS[cat],
      items: catalog.filter((a) => a.category === cat),
    }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="min-h-screen bg-ink-950">
      <PageHeader title="Rango y logros" back="/app/profile" />

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-4">
        {loading ? (
          <div className="space-y-4">
            <div className="h-28 card animate-pulse" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-40 card animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <RankCard xp={xp} />

            <p className="eyebrow text-zinc-500 px-1">
              {unlockedCount} de {catalog.length} logros desbloqueados
            </p>

            {grouped.map(({ cat, label, items }) => {
              const catUnlocked = items.filter((a) => unlocked.has(a.id)).length
              return (
                <div key={cat} className="rounded-2xl overflow-hidden border border-ink-800 bg-ink-900">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-ink-800">
                    <p className="display text-xs text-zinc-300 uppercase tracking-wider">{label}</p>
                    <span className="eyebrow text-zinc-500 text-xs">{catUnlocked}/{items.length}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-px bg-ink-800">
                    {items.map((a) => (
                      <div key={a.id} className="bg-ink-900">
                        <AchievementBadge
                          achievement={a}
                          unlocked={unlocked.has(a.id)}
                          value={stats ? valueForCategory(a.category, stats) : 0}
                          onClick={() => setSelected(a)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </main>

      {selected && (
        <AchievementModal
          achievement={selected}
          unlocked={unlocked.has(selected.id)}
          unlockedAt={unlocked.get(selected.id) ?? null}
          value={stats ? valueForCategory(selected.category, stats) : 0}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
