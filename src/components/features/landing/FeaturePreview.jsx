import { Check, Flame, Trophy, Medal, Search, Moon } from 'lucide-react'

/* ------------------------------------------------------------------ *
 * Mini vistas del contenido real de cada módulo. Van dentro de las
 * tarjetas de "Qué trae Forge": se entiende de un vistazo qué hace cada
 * función sin tener que leer la descripción.
 * ------------------------------------------------------------------ */

const Frame = ({ children, className = '' }) => (
  <div className={`rounded-xl bg-ink-950 border border-ink-800 p-3 h-32 overflow-hidden ${className}`}>
    {children}
  </div>
)

function LiveWorkout() {
  return (
    <Frame>
      <div className="flex items-center justify-between">
        <span className="chip-accent text-[9px] px-2 py-0.5">En curso</span>
        <span className="stat-num text-sm text-zinc-100">32:15</span>
      </div>
      <div className="space-y-1.5 mt-2.5">
        {[
          [60, 12, true],
          [70, 10, true],
          [80, 8, false],
        ].map(([kg, reps, done]) => (
          <div
            key={kg}
            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 border ${
              done ? 'border-ink-800 bg-ink-900' : 'border-accent/40 bg-accent/5'
            }`}
          >
            <span className="text-[10px] text-zinc-100 tabular-nums flex-1">
              <span className="font-semibold">{kg}</span>
              <span className="text-zinc-500"> kg × </span>
              <span className="font-semibold">{reps}</span>
            </span>
            {done ? (
              <Check size={11} strokeWidth={3} className="text-accent" />
            ) : (
              <span className="text-[8px] font-display uppercase tracking-wider text-accent">Ahora</span>
            )}
          </div>
        ))}
      </div>
    </Frame>
  )
}

function Catalog() {
  const items = [
    ['Press de banca', 'Pecho'],
    ['Sentadilla', 'Piernas'],
    ['Remo con barra', 'Espalda'],
  ]
  return (
    <Frame>
      <div className="flex items-center gap-2 rounded-lg bg-ink-900 border border-ink-800 px-2.5 py-1.5">
        <Search size={11} className="text-zinc-600" />
        <span className="text-[10px] text-zinc-600">Buscar ejercicio…</span>
      </div>
      <div className="space-y-1.5 mt-2">
        {items.map(([name, muscle]) => (
          <div key={name} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-ink-800 shrink-0" />
            <span className="text-[10px] text-zinc-200 flex-1 truncate">{name}</span>
            <span className="text-[8px] font-display uppercase tracking-wider text-accent shrink-0">
              {muscle}
            </span>
          </div>
        ))}
      </div>
    </Frame>
  )
}

function Routine() {
  const rows = [
    ['Press de banca', '4 × 8'],
    ['Press inclinado', '3 × 10'],
    ['Aperturas', '3 × 12'],
    ['Fondos', '3 × 10'],
  ]
  return (
    <Frame>
      <div className="flex items-center justify-between mb-2">
        <span className="font-display font-bold uppercase text-[11px] text-zinc-100">Push A</span>
        <span className="chip-accent text-[8px] px-1.5 py-0.5">Pecho</span>
      </div>
      <div className="space-y-1">
        {rows.map(([name, sets], i) => (
          <div key={name} className="flex items-center gap-2 rounded-md bg-ink-900 px-2 py-1.5">
            <span className="text-[9px] text-zinc-600 w-3">{i + 1}</span>
            <span className="text-[10px] text-zinc-200 flex-1 truncate">{name}</span>
            <span className="text-[9px] text-accent font-semibold tabular-nums">{sets}</span>
          </div>
        ))}
      </div>
    </Frame>
  )
}

function Calendar() {
  const days = [
    ['L', 'Push'],
    ['M', 'Pull'],
    ['M', null],
    ['J', 'Pierna'],
    ['V', 'Push'],
    ['S', 'Pull'],
    ['D', null],
  ]
  return (
    <Frame>
      <p className="eyebrow text-[8px] mb-2">Tu semana</p>
      <div className="grid grid-cols-7 gap-1">
        {days.map(([d, r], i) => (
          <div
            key={i}
            className={`rounded-md py-2 text-center ${
              r ? 'bg-accent/12 border border-accent/30' : 'bg-ink-900 border border-ink-800'
            }`}
          >
            <p className={`text-[9px] font-display font-bold ${r ? 'text-accent' : 'text-zinc-600'}`}>
              {d}
            </p>
            {r ? (
              <p className="text-[7px] text-zinc-400 mt-0.5 truncate px-0.5">{r}</p>
            ) : (
              <Moon size={8} className="text-zinc-700 mx-auto mt-1" />
            )}
          </div>
        ))}
      </div>
    </Frame>
  )
}

function Progress() {
  const bars = [40, 55, 48, 66, 72, 85, 100]
  return (
    <Frame>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-zinc-300">Press de banca</span>
        <span className="text-[9px] text-accent font-semibold">+22 kg</span>
      </div>
      <div className="flex items-end gap-1.5 h-16">
        {bars.map((h, i) => (
          <div
            key={i}
            style={{ height: `${h}%` }}
            className={`flex-1 rounded-t ${i === bars.length - 1 ? 'bg-accent' : 'bg-ink-700'}`}
          />
        ))}
      </div>
      <p className="text-[8px] text-zinc-600 uppercase tracking-wider mt-1.5">Últimas 7 semanas</p>
    </Frame>
  )
}

function Records() {
  return (
    <Frame>
      <div className="space-y-1.5">
        {[
          ['Sentadilla', '100 kg', '+5'],
          ['Peso muerto', '130 kg', '+10'],
          ['Press banca', '80 kg', '+2,5'],
        ].map(([name, kg, diff]) => (
          <div key={name} className="flex items-center gap-2 rounded-lg bg-ink-900 px-2.5 py-2">
            <Trophy size={11} className="text-accent shrink-0" />
            <span className="text-[10px] text-zinc-200 flex-1 truncate">{name}</span>
            <span className="stat-num text-[11px] text-zinc-100">{kg}</span>
            <span className="text-[8px] font-semibold text-accent shrink-0">{diff}</span>
          </div>
        ))}
      </div>
    </Frame>
  )
}

function Streak() {
  return (
    <Frame className="flex flex-col justify-center">
      <div className="flex items-center gap-2">
        <Flame size={16} className="text-accent" />
        <span className="stat-num text-2xl text-zinc-100">7</span>
        <span className="text-[10px] text-zinc-500">semanas seguidas</span>
      </div>
      <div className="flex gap-1 mt-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className={`h-6 flex-1 rounded ${i < 7 ? 'bg-accent' : 'bg-ink-800'}`}
            style={i < 7 ? { opacity: 0.45 + (i / 7) * 0.55 } : undefined}
          />
        ))}
      </div>
      <p className="text-[8px] text-zinc-600 uppercase tracking-wider mt-2">Últimas 12 semanas</p>
    </Frame>
  )
}

function Achievements() {
  return (
    <Frame className="flex flex-col justify-center">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-400">Rango</span>
        <span className="font-display font-bold uppercase text-sm text-accent">Acero</span>
      </div>
      <div className="h-1.5 rounded-full bg-ink-800 mt-2 overflow-hidden">
        <div className="h-full w-[68%] rounded-full bg-accent" />
      </div>
      <div className="flex gap-1.5 mt-3">
        {[Trophy, Flame, Medal, Trophy].map((Icon, i) => (
          <div
            key={i}
            className={`flex-1 h-9 rounded-lg flex items-center justify-center ${
              i < 3 ? 'bg-accent/12 text-accent' : 'bg-ink-900 text-zinc-700'
            }`}
          >
            <Icon size={13} />
          </div>
        ))}
      </div>
    </Frame>
  )
}

function Friends() {
  return (
    <Frame>
      <div className="space-y-1.5">
        {[
          ['D', 'Diego', 'Push A · 5,2 t'],
          ['S', 'Sofía', 'Récord: 95 kg'],
          ['M', 'Martín', '14 semanas'],
        ].map(([letter, name, detail]) => (
          <div key={name} className="flex items-center gap-2 rounded-lg bg-ink-900 px-2 py-1.5">
            <div className="w-6 h-6 rounded-full bg-ink-800 border border-ink-700 flex items-center justify-center text-[9px] font-display font-bold text-accent shrink-0">
              {letter}
            </div>
            <span className="text-[10px] text-zinc-200 shrink-0">{name}</span>
            <span className="text-[9px] text-zinc-500 truncate flex-1 text-right">{detail}</span>
          </div>
        ))}
      </div>
    </Frame>
  )
}

const PREVIEWS = {
  workout: LiveWorkout,
  catalog: Catalog,
  routine: Routine,
  calendar: Calendar,
  progress: Progress,
  records: Records,
  streak: Streak,
  achievements: Achievements,
  friends: Friends,
}

export default function FeaturePreview({ name }) {
  const Preview = PREVIEWS[name]
  return Preview ? <Preview /> : null
}
