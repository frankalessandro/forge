import { createElement, useEffect } from 'react'
import { X, Lock, Check } from 'lucide-react'
import { iconFor, CATEGORY_LABELS } from '../../utils/achievementIcons'

// Componente declarado fuera del render: resuelve el ícono dinámico a partir del
// nombre sin crear un componente nuevo en cada render.
function AchievementIcon({ name, ...props }) {
  return createElement(iconFor(name), props)
}

function formatValue(category, value) {
  switch (category) {
    case 'streak':   return `${value} día${value !== 1 ? 's' : ''}`
    case 'workouts': return `${value} entreno${value !== 1 ? 's' : ''}`
    case 'volume':   return `${(value / 1000).toFixed(1)} t`
    case 'strength':
    case 'bench':
    case 'squat':
    case 'deadlift': return `${value} kg`
    case 'prs':      return `${value} récord${value !== 1 ? 's' : ''}`
    default:         return `${value}`
  }
}

export default function AchievementModal({ achievement, unlocked, unlockedAt, value = 0, onClose }) {
  const threshold = Number(achievement.threshold)
  const pct = Math.min(100, threshold > 0 ? (value / threshold) * 100 : 0)
  const formattedValue = formatValue(achievement.category, value)
  const formattedThreshold = formatValue(achievement.category, threshold)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-ink-900 border border-ink-700 rounded-2xl p-6 shadow-2xl shadow-black/60 animate-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Ícono */}
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
          unlocked ? 'bg-accent/15 text-accent' : 'bg-ink-800 text-zinc-600'
        }`}>
          {unlocked ? <AchievementIcon name={achievement.icon} size={28} /> : <Lock size={28} />}
        </div>

        {/* Título + XP */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <h2 className="font-display font-bold uppercase tracking-tight text-xl text-zinc-100 leading-tight pr-2">
            {achievement.name}
          </h2>
          <span className="shrink-0 text-xs font-bold text-accent bg-accent/10 border border-accent/20 rounded-full px-2.5 py-1 whitespace-nowrap">
            {achievement.xp} XP
          </span>
        </div>

        {/* Categoría */}
        <p className="eyebrow text-zinc-500 text-[11px] uppercase tracking-wider">
          {CATEGORY_LABELS[achievement.category] ?? achievement.category}
        </p>

        {/* Descripción */}
        <p className="text-sm text-zinc-400 mt-3 leading-relaxed">{achievement.description}</p>

        {/* Progreso */}
        <div className="mt-5">
          <div className="flex justify-between items-center mb-1.5">
            <span className="eyebrow text-zinc-500 text-xs">Progreso</span>
            <span className="text-xs text-zinc-400">
              {unlocked ? formattedThreshold : `${formattedValue} / ${formattedThreshold}`}
            </span>
          </div>
          <div className="h-2 bg-ink-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${unlocked ? 'bg-accent' : 'bg-zinc-600'}`}
              style={{ width: `${unlocked ? 100 : pct}%` }}
            />
          </div>
        </div>

        {/* Fecha de desbloqueo */}
        {unlocked && unlockedAt && (
          <div className="flex items-center gap-2 mt-4 text-xs text-zinc-500">
            <Check size={13} className="text-accent shrink-0" />
            <span>
              Desbloqueado el{' '}
              {new Date(unlockedAt).toLocaleDateString('es-AR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
