// Paleta fija de 8 colores para el tag de rutina. El usuario elige el color
// al crear/editar la rutina (no se infiere del texto), se guarda en
// routines.category_color y viaja junto al tag.
export const TAG_COLORS = [
  { key: 'lime', label: 'Lima', chip: 'bg-accent/15 text-accent', dot: 'bg-accent' },
  { key: 'sky', label: 'Cielo', chip: 'bg-sky-400/15 text-sky-300', dot: 'bg-sky-400' },
  { key: 'fuchsia', label: 'Fucsia', chip: 'bg-fuchsia-400/15 text-fuchsia-300', dot: 'bg-fuchsia-400' },
  { key: 'amber', label: 'Ámbar', chip: 'bg-amber-400/15 text-amber-300', dot: 'bg-amber-400' },
  { key: 'rose', label: 'Rosa', chip: 'bg-rose-400/15 text-rose-300', dot: 'bg-rose-400' },
  { key: 'violet', label: 'Violeta', chip: 'bg-violet-400/15 text-violet-300', dot: 'bg-violet-400' },
  { key: 'cyan', label: 'Cian', chip: 'bg-cyan-400/15 text-cyan-300', dot: 'bg-cyan-400' },
  { key: 'orange', label: 'Naranja', chip: 'bg-orange-400/15 text-orange-300', dot: 'bg-orange-400' },
]

export function tagChipClass(color) {
  return TAG_COLORS.find((c) => c.key === color)?.chip ?? 'bg-ink-800 text-zinc-400'
}
