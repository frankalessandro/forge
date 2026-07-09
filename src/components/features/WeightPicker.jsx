import { useRef } from 'react'
import { Minus, Plus } from 'lucide-react'
import PersonFigure from './PersonFigure'

export const WEIGHT_MIN = 30
export const WEIGHT_MAX = 250
const PX_PER_KG = 10
const TAPE_RANGE_KG = 18 // kg visibles a cada lado de la aguja

const clampKg = (n) => Math.min(WEIGHT_MAX, Math.max(WEIGHT_MIN, Math.round(n * 2) / 2))

function formatKg(v) {
  return (v % 1 ? v.toFixed(1) : String(v)).replace('.', ',')
}

/**
 * Selector de peso con cinta métrica horizontal arrastrable: el NPC se
 * ensancha con el valor. `value` llega como string (estado del form).
 */
export default function WeightPicker({ value, onChange }) {
  const v = clampKg(Number(value) || 70)
  const drag = useRef(null)

  // 0.75× en el mínimo, ~1.65× en el máximo
  const widthScale = 0.75 + ((v - WEIGHT_MIN) / (WEIGHT_MAX - WEIGHT_MIN)) * 0.9

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, v }
  }
  const onPointerMove = (e) => {
    if (!drag.current) return
    // La cinta sigue al dedo: arrastrar a la izquierda trae números mayores.
    const next = clampKg(drag.current.v + (drag.current.x - e.clientX) / PX_PER_KG)
    if (next !== v) onChange(next)
  }
  const stopDrag = () => {
    drag.current = null
  }

  const ticks = []
  for (let k = Math.ceil(v - TAPE_RANGE_KG); k <= Math.floor(v + TAPE_RANGE_KG); k++) {
    if (k >= WEIGHT_MIN && k <= WEIGHT_MAX) ticks.push(k)
  }

  return (
    <div className="select-none">
      <div className="flex items-baseline justify-center gap-1.5 mb-2">
        <span className="stat-num text-5xl text-zinc-100 tabular-nums">{formatKg(v)}</span>
        <span className="display text-sm text-zinc-500">kg</span>
      </div>

      {/* NPC que se ensancha con el peso */}
      <div className="h-40 flex items-end justify-center overflow-hidden pointer-events-none">
        <PersonFigure
          className="text-accent"
          style={{
            height: 150,
            transform: `scaleX(${widthScale})`,
            transformOrigin: 'bottom center',
            transition: 'transform 80ms linear',
          }}
        />
      </div>

      {/* Cinta métrica */}
      <div
        className="relative h-16 rounded-2xl bg-ink-850 border border-ink-700 overflow-hidden cursor-ew-resize touch-none mt-3"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
      >
        {ticks.map((k) => {
          const major = k % 10 === 0
          const mid = !major && k % 5 === 0
          return (
            <div
              key={k}
              className="absolute bottom-0 flex flex-col items-center -translate-x-1/2 pointer-events-none"
              style={{ left: `calc(50% + ${(k - v) * PX_PER_KG}px)` }}
            >
              {major && (
                <span className="text-[10px] text-zinc-500 tabular-nums leading-none mb-1">{k}</span>
              )}
              <div className={`w-px bg-ink-500 ${major ? 'h-5' : mid ? 'h-3.5' : 'h-2'}`} />
            </div>
          )
        })}

        {/* Aguja central */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-accent pointer-events-none" />
      </div>

      <div className="flex items-center justify-between mt-3">
        <button
          type="button"
          onClick={() => onChange(clampKg(v - 0.5))}
          className="btn-dark w-10 h-10 rounded-xl p-0 flex items-center justify-center"
          aria-label="Medio kilo menos"
        >
          <Minus size={16} />
        </button>
        <p className="text-xs text-zinc-500">Arrastra la cinta para ajustar</p>
        <button
          type="button"
          onClick={() => onChange(clampKg(v + 0.5))}
          className="btn-dark w-10 h-10 rounded-xl p-0 flex items-center justify-center"
          aria-label="Medio kilo más"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}
