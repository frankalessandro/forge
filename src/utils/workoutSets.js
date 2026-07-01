// Etiquetas y colores para los distintos tipos de serie registrados en un entrenamiento.
export const SET_TYPE_LABEL = { normal: null, warmup: 'Calent.', dropset: 'Dropset', failure: 'Fallo' }
export const SET_TYPE_COLOR = { warmup: 'text-amber-300', dropset: 'text-fuchsia-300', failure: 'text-red-300' }

// Serie de trabajo (no calentamiento) con más peso dentro de un grupo de series.
export function bestSet(sets) {
  const working = sets.filter((s) => s.set_type !== 'warmup' && (s.weight_kg ?? 0) > 0)
  if (!working.length) return null
  return working.reduce((best, s) => ((s.weight_kg ?? 0) > (best.weight_kg ?? 0) ? s : best))
}
