import { Flame, Dumbbell, Trophy, Layers, Award, Medal, Crown, Mountain, Star } from 'lucide-react'

const ICON_MAP = {
  flame:    Flame,
  dumbbell: Dumbbell,
  trophy:   Trophy,
  layers:   Layers,
  award:    Award,
  medal:    Medal,
  crown:    Crown,
  mountain: Mountain,
  star:     Star,
}

export function iconFor(name) {
  return ICON_MAP[name] ?? Star
}
