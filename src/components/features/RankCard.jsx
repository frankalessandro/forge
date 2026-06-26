import { ChevronRight } from 'lucide-react'
import { rankForXp } from '../../utils/ranks'

/**
 * Tarjeta de rango. Muestra el rango actual, la XP y el progreso hacia el
 * siguiente rango. Si `interactive` es true, se ve como un elemento pulsable
 * (con chevron) — pensada para envolverse en un Link hacia los logros.
 */
export default function RankCard({ xp = 0, interactive = false }) {
  const { current, next, progress } = rankForXp(xp)
  return (
    <div className={`border rounded-2xl p-5 ${current.bg} ${interactive ? 'transition-colors hover:brightness-110' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow opacity-80">Rango</p>
          <p className={`font-display font-bold uppercase tracking-tight text-2xl leading-none mt-1 ${current.color}`}>
            {current.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="stat-num text-2xl text-zinc-100">{xp.toLocaleString('es')}</p>
            <p className="eyebrow text-zinc-500">XP</p>
          </div>
          {interactive && <ChevronRight size={20} className="text-zinc-500 -mr-1" />}
        </div>
      </div>
      <div className="mt-4">
        <div className="h-1.5 bg-ink-800/80 rounded-full overflow-hidden">
          <div className="h-full bg-current rounded-full transition-all" style={{ width: `${progress * 100}%`, color: 'inherit' }} />
        </div>
        <p className="text-xs text-zinc-500 mt-1.5">
          {next ? `${(next.min - xp).toLocaleString('es')} XP para ${next.name}` : 'Rango máximo alcanzado'}
        </p>
      </div>
    </div>
  )
}
