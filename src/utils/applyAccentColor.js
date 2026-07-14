import { accentColorFor } from './accentColors'

// Pisa las variables CSS del acento (definidas en @theme, index.css) con las
// del color elegido. key null/desconocido resuelve al verde de marca, que
// tiene los mismos valores que el @theme por defecto.
export function applyAccentColor(key) {
  const color = accentColorFor(key)
  const root = document.documentElement.style
  root.setProperty('--color-accent', color.base)
  root.setProperty('--color-accent-bright', color.bright)
  root.setProperty('--color-accent-dim', color.dim)
}
