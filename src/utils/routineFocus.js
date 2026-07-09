// Categoría estructurada de rutina (lista fija), separada del tag libre de
// texto (`category`/`category_color`). Da una idea general del enfoque sin
// encerrar al usuario en terminología de split avanzado. Cada categoría tiene
// un color fijo (no elegible) para que el badge se reconozca de un vistazo
// en toda la app.
export const FOCUS_OPTIONS = [
  { key: 'full_body', label: 'Cuerpo completo', chip: 'bg-accent/15 text-accent' },
  { key: 'upper_body', label: 'Tren superior', chip: 'bg-sky-400/15 text-sky-300' },
  { key: 'lower_body', label: 'Tren inferior', chip: 'bg-indigo-400/15 text-indigo-300' },
  { key: 'push', label: 'Empuje', chip: 'bg-amber-400/15 text-amber-300' },
  { key: 'pull', label: 'Tirón', chip: 'bg-violet-400/15 text-violet-300' },
  { key: 'legs', label: 'Pierna', chip: 'bg-emerald-400/15 text-emerald-300' },
  { key: 'chest', label: 'Pecho', chip: 'bg-rose-400/15 text-rose-300' },
  { key: 'back', label: 'Espalda', chip: 'bg-cyan-400/15 text-cyan-300' },
  { key: 'shoulders', label: 'Hombro', chip: 'bg-orange-400/15 text-orange-300' },
  { key: 'arms', label: 'Brazo', chip: 'bg-fuchsia-400/15 text-fuchsia-300' },
  { key: 'glutes', label: 'Glúteo', chip: 'bg-pink-400/15 text-pink-300' },
  { key: 'core', label: 'Core', chip: 'bg-teal-400/15 text-teal-300' },
  { key: 'cardio', label: 'Cardio', chip: 'bg-red-400/15 text-red-300' },
  { key: 'mobility', label: 'Movilidad', chip: 'bg-yellow-400/15 text-yellow-300' },
]

function focusOption(key) {
  return FOCUS_OPTIONS.find((f) => f.key === key)
}

export function focusLabel(key) {
  return focusOption(key)?.label ?? null
}

export function focusChipClass(key) {
  return focusOption(key)?.chip ?? 'bg-ink-800 text-zinc-400'
}
