import { Flame, Dumbbell, Trophy, Layers, Award, Medal, Crown, Mountain, Star } from 'lucide-react'

// Mapea el nombre de ícono guardado en achievements.icon al componente lucide.
const ICON_MAP = {
  flame: Flame,
  dumbbell: Dumbbell,
  trophy: Trophy,
  layers: Layers,
  award: Award,
  medal: Medal,
  crown: Crown,
  mountain: Mountain,
}

export function iconFor(name) {
  return ICON_MAP[name] ?? Star
}
