import { useState, useEffect, useCallback, useMemo } from 'react'
import { sileo } from 'sileo'
import { ChevronLeft, ChevronRight, X, CalendarDays } from 'lucide-react'
import { useRoutines } from '../../hooks/useRoutines'
import { useSchedule, resolveDay, toDateKey, DAY_ROWS } from '../../hooks/useSchedule'
import PageHeader from '../../components/ui/PageHeader'
import FocusBadge from '../../components/ui/FocusBadge'
import TutorialGuide from '../../components/features/TutorialGuide'

const WEEKDAY_HEADERS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']

const MONTH_LABEL = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' })

// Convierte Date#getDay() (0=domingo) al índice de columna lunes-primero (0=lunes).
function mondayIndex(jsDay) {
  return (jsDay + 6) % 7
}

function buildMonthGrid(cursor) {
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leading = mondayIndex(first.getDay())
  const cells = []
  for (let i = 0; i < leading; i++) {
    const d = new Date(year, month, 1 - (leading - i))
    cells.push({ date: d, inMonth: false })
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: new Date(year, month, day), inMonth: true })
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false })
  }
  return cells
}

function DaySheet({ date, template, ownRoutines, currentOverride, onSave, onClose }) {
  const templateRoutine = template[date.getDay()]
  const [choice, setChoice] = useState(() => {
    if (currentOverride === undefined) return '__template__'
    return currentOverride ? currentOverride.id : '__rest__'
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    try {
      setSaving(true)
      await onSave(choice)
      onClose()
    } catch (err) {
      sileo.error({ title: 'Error al guardar', description: err.message })
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mt-auto bg-ink-900 border-t border-ink-700 rounded-t-3xl flex flex-col max-h-[85vh] pb-[env(safe-area-inset-bottom)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-ink-600 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-ink-800">
          <h2 className="display text-sm text-zinc-100">
            {date.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
          <label className="flex items-center gap-3 py-2.5 px-3 rounded-xl border border-ink-800 cursor-pointer">
            <input type="radio" checked={choice === '__template__'} onChange={() => setChoice('__template__')} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-100">Usar la plantilla</p>
              <p className="text-xs text-zinc-500">{templateRoutine ? templateRoutine.name : 'Descanso'}</p>
            </div>
          </label>

          <label className="flex items-center gap-3 py-2.5 px-3 rounded-xl border border-ink-800 cursor-pointer">
            <input type="radio" checked={choice === '__rest__'} onChange={() => setChoice('__rest__')} />
            <p className="text-sm text-zinc-100 flex-1">Descanso (solo hoy)</p>
          </label>

          {ownRoutines.map((r) => (
            <label key={r.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl border border-ink-800 cursor-pointer">
              <input type="radio" checked={choice === r.id} onChange={() => setChoice(r.id)} />
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <p className="text-sm text-zinc-100 truncate">{r.name}</p>
                <FocusBadge focus={r.focus} />
              </div>
            </label>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-ink-800">
          <button onClick={handleSave} disabled={saving} className="btn-accent w-full py-3 text-sm">
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Schedule() {
  const { getUserRoutines } = useRoutines()
  const { getWeeklyTemplate, setTemplateDay, getExceptions, setException, clearException } = useSchedule()

  const [ownRoutines, setOwnRoutines] = useState([])
  const [template, setTemplateState] = useState(Array(7).fill(null))
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [exceptions, setExceptions] = useState(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [user, tmpl] = await Promise.all([
          getUserRoutines(),
          getWeeklyTemplate(),
        ])
        if (cancelled) return
        setOwnRoutines(user)
        setTemplateState(tmpl)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [getUserRoutines, getWeeklyTemplate])

  const fetchExceptions = useCallback((cursor) => {
    const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)
    return getExceptions(start, end)
  }, [getExceptions])

  useEffect(() => {
    let cancelled = false
    fetchExceptions(monthCursor)
      .then((map) => { if (!cancelled) setExceptions(map) })
      .catch((err) => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [monthCursor, fetchExceptions])

  const handleTemplateChange = async (dow, routineId) => {
    const prev = template
    const routine = routineId ? ownRoutines.find((r) => r.id === routineId) : null
    setTemplateState((t) => t.map((r, i) => (i === dow ? routine : r)))
    try {
      await setTemplateDay(dow, routineId || null)
    } catch (err) {
      setTemplateState(prev)
      sileo.error({ title: 'Error al guardar', description: err.message })
    }
  }

  const grid = useMemo(() => buildMonthGrid(monthCursor), [monthCursor])
  const todayKey = toDateKey(new Date())

  const handleDaySheetSave = async (choice) => {
    if (!selectedDate) return
    if (choice === '__template__') {
      await clearException(selectedDate)
    } else if (choice === '__rest__') {
      await setException(selectedDate, null)
    } else {
      await setException(selectedDate, choice)
    }
    setExceptions(await fetchExceptions(monthCursor))
  }

  return (
    <div className="min-h-screen bg-ink-950">
      <TutorialGuide module="schedule" />
      <PageHeader title="Agenda de rutinas" back="/app/routines" />

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-8 pb-[calc(var(--nav-h)+2rem)]">
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
        )}

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-64 card" />
            <div className="h-80 card" />
          </div>
        ) : (
          <>
            <section className="space-y-3" data-tutorial="schedule-week">
              <h2 className="section-title">Plantilla semanal</h2>
              <div className="card divide-y divide-ink-800">
                {DAY_ROWS.map(({ dow, label }) => (
                  <div key={dow} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-sm text-zinc-300 w-24 shrink-0">{label}</span>
                    <select
                      value={template[dow]?.id ?? ''}
                      onChange={(e) => handleTemplateChange(dow, e.target.value)}
                      className="input flex-1 py-2 text-sm"
                    >
                      <option value="">Descanso</option>
                      {ownRoutines.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              {ownRoutines.length === 0 && (
                <p className="text-xs text-zinc-600">Agrega una rutina a "Mis rutinas" para poder asignarla a un día.</p>
              )}
            </section>

            <section className="space-y-3" data-tutorial="schedule-month">
              <div className="flex items-center justify-between">
                <h2 className="section-title flex-1 capitalize">{MONTH_LABEL.format(monthCursor)}</h2>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setMonthCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
                    className="p-1.5 text-zinc-500 hover:text-zinc-100 transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setMonthCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
                    className="p-1.5 text-zinc-500 hover:text-zinc-100 transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div className="card p-3">
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {WEEKDAY_HEADERS.map((h) => (
                    <div key={h} className="text-center text-xs text-zinc-600 py-1">{h}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {grid.map(({ date, inMonth }) => {
                    const key = toDateKey(date)
                    const resolved = resolveDay(date, template, exceptions)
                    const isToday = key === todayKey
                    return (
                      <button
                        key={key}
                        disabled={!inMonth}
                        onClick={() => setSelectedDate(date)}
                        className={`flex flex-col items-center justify-start gap-1 rounded-lg py-2 min-h-[3.5rem] transition-colors ${
                          inMonth ? 'hover:bg-ink-800' : 'opacity-30 cursor-default'
                        } ${isToday ? 'ring-1 ring-accent' : ''}`}
                      >
                        <span className={`text-xs ${isToday ? 'text-accent' : 'text-zinc-400'}`}>{date.getDate()}</span>
                        {inMonth && resolved && (
                          <span className="text-[10px] leading-tight text-center text-zinc-300 px-1 truncate w-full">
                            {resolved.name}
                          </span>
                        )}
                        {inMonth && !resolved && (
                          <span className="text-[10px] text-zinc-700">·</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
              <p className="text-xs text-zinc-600 flex items-center gap-1.5">
                <CalendarDays size={12} />
                Toca un día para cambiarlo solo esa vez, sin afectar la plantilla.
              </p>
            </section>
          </>
        )}
      </main>

      {selectedDate && (
        <DaySheet
          date={selectedDate}
          template={template}
          ownRoutines={ownRoutines}
          currentOverride={exceptions.get(toDateKey(selectedDate))}
          onSave={handleDaySheetSave}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  )
}
