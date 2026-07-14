// Paleta de acentos (feature premium). Cada opción define el mismo trío de
// tonos que usa el acento por defecto en index.css (base/bright/dim), para
// que hover, glow y demás sigan funcionando igual sin importar el color.
// key: null representa el verde de marca (no pisa las variables CSS,
// simplemente usa el @theme de index.css tal cual).
export const ACCENT_COLORS = [
  { key: null, label: 'Verde', base: '#a3e635', bright: '#c4f95a', dim: '#4d7c0f' },
  { key: 'blue', label: 'Azul', base: '#3b82f6', bright: '#60a5fa', dim: '#1e3a8a' },
  { key: 'red', label: 'Rojo', base: '#ef4444', bright: '#f87171', dim: '#7f1d1d' },
  { key: 'purple', label: 'Púrpura', base: '#a855f7', bright: '#c084fc', dim: '#581c87' },
  { key: 'orange', label: 'Naranja', base: '#f97316', bright: '#fb923c', dim: '#7c2d12' },
  { key: 'pink', label: 'Rosa', base: '#ec4899', bright: '#f472b6', dim: '#831843' },
  { key: 'cyan', label: 'Cian', base: '#06b6d4', bright: '#22d3ee', dim: '#164e63' },
  { key: 'amber', label: 'Ámbar', base: '#f59e0b', bright: '#fbbf24', dim: '#78350f' },
  { key: 'indigo', label: 'Índigo', base: '#6366f1', bright: '#818cf8', dim: '#312e81' },
]

export function accentColorFor(key) {
  return ACCENT_COLORS.find((c) => c.key === key) ?? ACCENT_COLORS[0]
}
