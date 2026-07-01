// Formatea la duración entre dos timestamps ISO en un string legible
// (ej. "1h 20m", "45m 30s", "12s").
export function formatDuration(startedAt, finishedAt) {
  const ms = new Date(finishedAt) - new Date(startedAt)
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function formatDay(isoStr) {
  const d = new Date(isoStr)
  return d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function formatHour(isoStr) {
  return new Date(isoStr).toTimeString().slice(0, 5)
}
