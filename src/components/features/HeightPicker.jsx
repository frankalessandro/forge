import { useRef } from 'react'
import { Minus, Plus } from 'lucide-react'
import PersonFigure from './PersonFigure'

export const HEIGHT_MIN = 100
export const HEIGHT_MAX = 230
const CANVAS_CM = HEIGHT_MAX + 20 // el lienzo completo equivale a 250 cm
const CANVAS_H = 288 // px, debe coincidir con h-72
const DRAG_CM_PER_PX = 0.35

const clampCm = (n) => Math.min(HEIGHT_MAX, Math.max(HEIGHT_MIN, Math.round(n)))

const RULER_TICKS = []
for (let cm = HEIGHT_MIN; cm <= HEIGHT_MAX; cm += 10) RULER_TICKS.push(cm)

/**
 * Selector de altura arrastrable: el NPC crece/encoge con el valor,
 * con regla lateral en cm. `value` llega como string (estado del form).
 */
export default function HeightPicker({ value, onChange }) {
  const v = clampCm(Number(value) || 170)
  const drag = useRef(null)

  const personPx = (v / CANVAS_CM) * CANVAS_H

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { y: e.clientY, v }
  }
  const onPointerMove = (e) => {
    if (!drag.current) return
    const next = clampCm(drag.current.v + (drag.current.y - e.clientY) * DRAG_CM_PER_PX)
    if (next !== v) onChange(next)
  }
  const stopDrag = () => {
    drag.current = null
  }

  return (
    <div className="select-none">
      <div className="flex items-baseline justify-center gap-1.5 mb-4">
        <span className="stat-num text-5xl text-zinc-100 tabular-nums">{v}</span>
        <span className="display text-sm text-zinc-500">cm</span>
      </div>

      <div
        className="relative h-72 rounded-2xl bg-ink-850 border border-ink-700 overflow-hidden cursor-ns-resize touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
      >
        {/* Regla lateral */}
        {RULER_TICKS.map((cm) => (
          <div
            key={cm}
            className="absolute right-2 flex items-center gap-1.5 pointer-events-none"
            style={{ bottom: `calc(${(cm / CANVAS_CM) * 100}% - 6px)` }}
          >
            <span className="text-[10px] text-zinc-600 tabular-nums leading-none">{cm}</span>
            <div className="w-3 h-px bg-ink-600" />
          </div>
        ))}

        {/* Línea a la altura de la cabeza */}
        <div
          className="absolute inset-x-0 border-t border-dashed border-accent/50 pointer-events-none"
          style={{ bottom: personPx }}
        />

        {/* NPC anclado al piso */}
        <div className="absolute inset-x-0 bottom-0 flex justify-center items-end pointer-events-none">
          <PersonFigure className="text-accent" style={{ height: personPx, transition: 'height 80ms linear' }} />
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <button
          type="button"
          onClick={() => onChange(clampCm(v - 1))}
          className="btn-dark w-10 h-10 rounded-xl p-0 flex items-center justify-center"
          aria-label="Un centímetro menos"
        >
          <Minus size={16} />
        </button>
        <p className="text-xs text-zinc-500">Arrastra hacia arriba o abajo</p>
        <button
          type="button"
          onClick={() => onChange(clampCm(v + 1))}
          className="btn-dark w-10 h-10 rounded-xl p-0 flex items-center justify-center"
          aria-label="Un centímetro más"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}
