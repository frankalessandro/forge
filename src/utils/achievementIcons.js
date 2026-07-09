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

export const CATEGORY_LABELS = {
  streak:   'Constancia',
  workouts: 'Entrenos',
  volume:   'Volumen',
  strength: 'Fuerza',
  bench:    'Press de Banca',
  squat:    'Sentadilla',
  deadlift: 'Peso Muerto',
  prs:      'Récords Personales',
}
