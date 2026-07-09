// Para ejercicios de mancuernas, `weight_kg` se registra por mancuerna
// (lo que el usuario realmente carga en cada mano). El volumen y los
// totales mostrados se calculan duplicando ese valor.
export function isDumbbell(equipment) {
  return (equipment ?? '').toLowerCase() === 'dumbbell'
}

export function displayWeight(weightKg, equipment) {
  const w = weightKg ?? 0
  return isDumbbell(equipment) ? w * 2 : w
}

// Volumen total de una lista de series: suma reps * peso (ajustado para
// mancuernas). Por defecto excluye series de calentamiento. Soporta tanto
// series con `exercises` anidado (joins de Supabase) como series planas con
// `equipment` directo (resultados de funciones RPC).
export function calcVolume(sets, { includeWarmup = false } = {}) {
  return sets
    .filter((s) => includeWarmup || s.set_type !== 'warmup')
    .reduce((acc, s) => acc + (s.reps ?? 0) * displayWeight(s.weight_kg, s.exercises?.equipment ?? s.equipment), 0)
}
