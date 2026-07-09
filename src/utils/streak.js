// Racha basada en el objetivo semanal del usuario, no en días consecutivos.
//
// La idea: la semana (lunes a domingo) se considera "cumplida" si entrenaste al
// menos `training_days_per_week` días dentro de ella. La racha cuenta semanas
// consecutivas cumplidas hacia atrás. La semana en curso nunca rompe la racha:
// si todavía no llegaste al objetivo, simplemente aún no suma, pero no la corta.

export function toDateStr(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Lunes (00:00 local) de la semana que contiene a `date`.
export function getMonday(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

// Construye las últimas `weeksBack` semanas (índice 0 = semana actual).
// `sessionDates`: fechas (Date o ISO) de sesiones finalizadas.
// `goal`: objetivo de días por semana (>= 1).
export function buildWeeks(sessionDates, goal, weeksBack = 12) {
  const target = goal && goal > 0 ? goal : 1
  const trainedSet = new Set((sessionDates ?? []).map(toDateStr))
  const thisMonday = getMonday(new Date())
  const weeks = []

  for (let i = 0; i < weeksBack; i++) {
    const start = new Date(thisMonday)
    start.setDate(start.getDate() - i * 7)

    const days = []
    for (let d = 0; d < 7; d++) {
      const day = new Date(start)
      day.setDate(day.getDate() + d)
      const str = toDateStr(day)
      days.push({ date: day, str, trained: trainedSet.has(str) })
    }

    const count = days.filter((d) => d.trained).length
    weeks.push({
      start,
      days,
      count,
      target,
      met: count >= target,
      isCurrent: i === 0,
    })
  }

  return weeks // índice 0 = semana actual
}

// Mejor racha histórica de semanas cumplidas (para logros). Igual que en
// computeStreak, la semana en curso no corta una racha si aún no llegó al
// objetivo — simplemente no suma todavía.
export function computeMaxStreak(weeks) {
  let best = 0
  let run = 0
  // weeks viene con índice 0 = semana actual; recorremos de la más vieja a hoy.
  for (let i = weeks.length - 1; i >= 0; i--) {
    const w = weeks[i]
    if (w.met) {
      run++
      if (run > best) best = run
    } else if (!w.isCurrent) {
      run = 0
    }
  }
  return best
}

// Cuenta semanas consecutivas cumplidas. La semana en curso suma si ya cumplió
// el objetivo; si todavía no, no rompe la racha (sigue contando las anteriores).
export function computeStreak(weeks) {
  let streak = 0
  for (let i = 0; i < weeks.length; i++) {
    if (weeks[i].met) {
      streak++
    } else if (weeks[i].isCurrent) {
      continue
    } else {
      break
    }
  }
  return streak
}
