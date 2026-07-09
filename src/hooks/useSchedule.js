import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getCurrentUserId } from '../stores/authStore'

const ROUTINE_FIELDS = 'id, name, focus, category, category_color'

// Orden de UI (lunes primero) con el day_of_week real que usa la tabla
// (0=domingo..6=sábado, igual que Date#getDay()).
export const DAY_ROWS = [
  { dow: 1, label: 'Lunes' },
  { dow: 2, label: 'Martes' },
  { dow: 3, label: 'Miércoles' },
  { dow: 4, label: 'Jueves' },
  { dow: 5, label: 'Viernes' },
  { dow: 6, label: 'Sábado' },
  { dow: 0, label: 'Domingo' },
]

// Convierte una fecha a 'YYYY-MM-DD' en horario local (evita el corrimiento
// de día que trae toISOString() al usar UTC).
export function toDateKey(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function useSchedule() {
  // Plantilla semanal: array de 7 posiciones (0=domingo..6=sábado, igual que
  // Date#getDay()), cada una con la rutina asignada o null (= descanso).
  const getWeeklyTemplate = useCallback(async () => {
    const userId = getCurrentUserId()
    const { data, error } = await supabase
      .from('routine_schedule')
      .select(`day_of_week, routine_id, routines (${ROUTINE_FIELDS})`)
      .eq('user_id', userId)
    if (error) throw error
    const template = Array(7).fill(null)
    for (const row of data ?? []) template[row.day_of_week] = row.routines
    return template
  }, [])

  const setTemplateDay = useCallback(async (dayOfWeek, routineId) => {
    const userId = getCurrentUserId()
    if (!routineId) {
      const { error } = await supabase
        .from('routine_schedule')
        .delete()
        .eq('user_id', userId)
        .eq('day_of_week', dayOfWeek)
      if (error) throw error
      return
    }
    const { error } = await supabase
      .from('routine_schedule')
      .upsert(
        { user_id: userId, day_of_week: dayOfWeek, routine_id: routineId, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,day_of_week' },
      )
    if (error) throw error
  }, [])

  // Excepciones puntuales en un rango de fechas [start, end] (inclusive).
  // Devuelve un Map de 'YYYY-MM-DD' -> rutina | null (null = descanso forzado).
  const getExceptions = useCallback(async (start, end) => {
    const userId = getCurrentUserId()
    const { data, error } = await supabase
      .from('routine_schedule_overrides')
      .select(`date, routine_id, routines (${ROUTINE_FIELDS})`)
      .eq('user_id', userId)
      .gte('date', toDateKey(start))
      .lte('date', toDateKey(end))
    if (error) throw error
    const map = new Map()
    for (const row of data ?? []) map.set(row.date, row.routine_id ? row.routines : null)
    return map
  }, [])

  // routineId puede ser un id (asignar rutina ese día), null (forzar descanso
  // ese día) o undefined (no debería llamarse así; usar clearException).
  const setException = useCallback(async (date, routineId) => {
    const userId = getCurrentUserId()
    const { error } = await supabase
      .from('routine_schedule_overrides')
      .upsert(
        { user_id: userId, date: toDateKey(date), routine_id: routineId ?? null },
        { onConflict: 'user_id,date' },
      )
    if (error) throw error
  }, [])

  const clearException = useCallback(async (date) => {
    const userId = getCurrentUserId()
    const { error } = await supabase
      .from('routine_schedule_overrides')
      .delete()
      .eq('user_id', userId)
      .eq('date', toDateKey(date))
    if (error) throw error
  }, [])

  return { getWeeklyTemplate, setTemplateDay, getExceptions, setException, clearException }
}

// Resuelve qué rutina toca un día dado: excepción puntual primero (incluido
// el caso explícito "descanso forzado" = null), si no hay cae a la plantilla
// semanal por día de la semana. Sin plantilla ni excepción = descanso.
// `exceptions` es el Map que devuelve getExceptions (opcional).
export function resolveDay(date, template, exceptions) {
  const key = toDateKey(date)
  if (exceptions?.has(key)) return exceptions.get(key)
  return template?.[new Date(date).getDay()] ?? null
}
