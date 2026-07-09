// El tag libre de rutina elige color de una paleta fija de 12 (no es texto
// libre ni un color picker arbitrario). Se guarda el hex directo en
// routines.category_color — la tabla acepta cualquier hex válido, así que
// esto no requiere ninguna migración especial, solo restringimos las
// opciones acá en el front.
export const TAG_COLORS = [
  { key: 'lime', label: 'Lima', hex: '#a3e635' },
  { key: 'sky', label: 'Cielo', hex: '#38bdf8' },
  { key: 'fuchsia', label: 'Fucsia', hex: '#e879f9' },
  { key: 'amber', label: 'Ámbar', hex: '#fbbf24' },
  { key: 'rose', label: 'Rosa', hex: '#fb7185' },
  { key: 'violet', label: 'Violeta', hex: '#a78bfa' },
  { key: 'cyan', label: 'Cian', hex: '#22d3ee' },
  { key: 'orange', label: 'Naranja', hex: '#fb923c' },
  { key: 'emerald', label: 'Esmeralda', hex: '#34d399' },
  { key: 'indigo', label: 'Índigo', hex: '#818cf8' },
  { key: 'pink', label: 'Rosa fuerte', hex: '#f472b6' },
  { key: 'teal', label: 'Verde azulado', hex: '#2dd4bf' },
]

export const DEFAULT_TAG_COLOR = TAG_COLORS[0].hex // lima, mismo tono que el accent de la marca

export function hexToRgba(hex, alpha = 1) {
  const clean = (hex ?? '').replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const bigint = parseInt(full, 16)
  if (Number.isNaN(bigint) || full.length !== 6) return `rgba(163, 230, 53, ${alpha})`
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function tagChipStyle(color) {
  if (!color) return undefined
  return { backgroundColor: hexToRgba(color, 0.15), color }
}
