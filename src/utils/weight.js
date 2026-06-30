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
