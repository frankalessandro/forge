// ============================================================
// FORGE — Sistema de rangos según XP acumulado.
// La XP proviene de los logros desbloqueados (achievements.xp).
// Con ~51 logros el XP máximo posible es ~24 000.
// ============================================================

export const RANKS = [
  { name: 'Hierro',    min: 0,     color: 'text-zinc-400',   bg: 'bg-zinc-400/10 border-zinc-400/25' },
  { name: 'Bronce',   min: 250,   color: 'text-amber-600',  bg: 'bg-amber-600/10 border-amber-600/25' },
  { name: 'Plata',    min: 700,   color: 'text-zinc-300',   bg: 'bg-zinc-300/10 border-zinc-300/25' },
  { name: 'Oro',      min: 1800,  color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/25' },
  { name: 'Platino',  min: 4000,  color: 'text-cyan-300',   bg: 'bg-cyan-300/10 border-cyan-300/25' },
  { name: 'Diamante', min: 8000,  color: 'text-sky-300',    bg: 'bg-sky-300/10 border-sky-300/25' },
  { name: 'Élite',    min: 16000, color: 'text-accent',     bg: 'bg-accent/10 border-accent/25' },
]

// Devuelve el rango actual, el siguiente (si lo hay) y el progreso [0..1]
// dentro del tramo hacia el próximo rango.
export function rankForXp(xp = 0) {
  let index = 0
  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].min) index = i
  }
  const current = RANKS[index]
  const next = RANKS[index + 1] ?? null
  const progress = next
    ? Math.min(1, (xp - current.min) / (next.min - current.min))
    : 1
  return { current, next, progress, index, xp }
}
