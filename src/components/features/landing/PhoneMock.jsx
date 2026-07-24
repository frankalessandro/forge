import { Home, ClipboardList, TrendingUp, User, Plus, Play, Flame, CalendarDays, Check, Trophy } from 'lucide-react'

/* ------------------------------------------------------------------ *
 * Réplicas simplificadas de las pantallas reales de Forge. Son puro
 * markup decorativo (aria-hidden desde el contenedor): sirven para que
 * el visitante vea la app antes de registrarse, sin cargar la app real.
 * ------------------------------------------------------------------ */

function ScreenHome() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow text-[9px]">Buenas tardes</p>
          <p className="font-display font-bold uppercase text-lg text-zinc-100 leading-none mt-1">Frank</p>
        </div>
        <span className="chip-accent text-[9px] px-2 py-0.5">
          <Flame size={9} /> 7 sem
        </span>
      </div>

      <div className="flex items-center gap-2 card px-3 py-2">
        <div className="bg-ink-800 rounded-md p-1.5 text-accent">
          <CalendarDays size={12} />
        </div>
        <div className="flex-1">
          <p className="eyebrow text-[8px]">Hoy toca</p>
          <p className="text-[11px] text-zinc-100">Push · Pecho y hombro</p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-accent text-ink-950 p-4">
        <p className="font-display uppercase tracking-[0.18em] text-[8px] font-bold opacity-70">
          Listo para entrenar
        </p>
        <p className="font-display font-bold uppercase text-2xl leading-[0.95] mt-1.5">
          Empezar<br />entreno
        </p>
        <span className="inline-flex items-center gap-1.5 mt-3 font-display font-semibold uppercase text-[10px] bg-ink-950 text-accent rounded-lg px-2.5 py-1.5">
          <Play size={10} fill="currentColor" /> Vamos
        </span>
      </div>

      <div>
        <p className="section-title text-[9px] mb-2">Esta semana</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            ['4', 'Entrenos'],
            ['12,4t', 'Volumen'],
            ['7', 'Racha'],
          ].map(([v, l], i) => (
            <div key={l} className="card px-2 py-2.5 text-center">
              <p className={`stat-num text-base ${i === 2 ? 'text-accent' : 'text-zinc-100'}`}>{v}</p>
              <p className="text-[8px] text-zinc-500 mt-0.5 uppercase tracking-wider">{l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ScreenWorkout() {
  const sets = [
    { n: 1, kg: 60, reps: 12, done: true },
    { n: 2, kg: 70, reps: 10, done: true },
    { n: 3, kg: 80, reps: 8, done: false },
  ]
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="chip-accent text-[9px] px-2 py-0.5">En curso</span>
        <p className="stat-num text-xl text-zinc-100">32:15</p>
      </div>

      <div>
        <p className="eyebrow text-[9px]">Ejercicio 2 de 5</p>
        <p className="font-display font-bold uppercase text-xl text-zinc-100 leading-none mt-1">
          Press de banca
        </p>
        <p className="text-[10px] text-zinc-500 mt-1">Pecho · Barra</p>
      </div>

      <div className="space-y-1.5">
        {sets.map((s) => (
          <div
            key={s.n}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 border ${
              s.done ? 'border-ink-800 bg-ink-900' : 'border-accent/40 bg-accent/5'
            }`}
          >
            <span className="w-5 h-5 rounded-md bg-ink-800 text-zinc-400 text-[9px] font-display font-bold flex items-center justify-center">
              {s.n}
            </span>
            <p className="flex-1 text-xs text-zinc-100 tabular-nums">
              <span className="font-semibold">{s.kg}</span>
              <span className="text-zinc-500"> kg × </span>
              <span className="font-semibold">{s.reps}</span>
            </p>
            {s.done ? (
              <span className="text-accent">
                <Check size={13} strokeWidth={3} />
              </span>
            ) : (
              <span className="text-[8px] font-display uppercase tracking-wider text-accent">Ahora</span>
            )}
          </div>
        ))}
      </div>

      <div className="card p-3">
        <div className="flex items-center justify-between">
          <p className="eyebrow text-[8px]">Descanso</p>
          <p className="stat-num text-sm text-accent">0:45</p>
        </div>
        <div className="h-1 rounded-full bg-ink-800 mt-2 overflow-hidden">
          <div className="h-full w-1/2 rounded-full bg-accent" />
        </div>
      </div>
    </div>
  )
}

function ScreenProgress() {
  const bars = [38, 52, 45, 68, 61, 80, 95]
  return (
    <div className="p-4 space-y-4">
      <div>
        <p className="eyebrow text-[9px]">Progreso</p>
        <p className="font-display font-bold uppercase text-lg text-zinc-100 leading-none mt-1">
          Press de banca
        </p>
      </div>

      <div className="card p-3">
        <div className="flex items-end justify-between h-24 gap-1.5">
          {bars.map((h, i) => (
            <div
              key={i}
              style={{ height: `${h}%` }}
              className={`flex-1 rounded-t-md ${i === bars.length - 1 ? 'bg-accent' : 'bg-ink-700'}`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-[8px] text-zinc-600 uppercase tracking-wider">Últimas 7 semanas</p>
          <p className="text-[9px] text-accent font-semibold">+22 kg</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {[
          ['Sentadilla', '100 kg', 'Nuevo récord'],
          ['Peso muerto', '130 kg', 'Hace 6 días'],
        ].map(([name, kg, hint]) => (
          <div key={name} className="card flex items-center gap-2.5 px-3 py-2.5">
            <div className="bg-accent/15 text-accent rounded-lg p-1.5">
              <Trophy size={12} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-zinc-100">{name}</p>
              <p className="text-[8px] text-zinc-500">{hint}</p>
            </div>
            <p className="stat-num text-sm text-zinc-100">{kg}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const SCREENS = { home: ScreenHome, workout: ScreenWorkout, progress: ScreenProgress }

/**
 * Carcasa del teléfono. Si `screen` viene definido renderiza solo esa pantalla
 * (uso en móvil); si no, renderiza las tres apiladas con `data-screen` para que
 * la sección las cruce con GSAP según el scroll (uso en desktop).
 */
export default function PhoneMock({ screen, className = '' }) {
  const keys = screen ? [screen] : Object.keys(SCREENS)

  return (
    <div
      aria-hidden
      className={`relative mx-auto w-[260px] sm:w-[280px] rounded-[2.4rem] border border-ink-700 bg-ink-900 p-2.5 shadow-2xl shadow-black/60 ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[2.4rem] ring-1 ring-inset ring-white/5"
      />
      {/* Notch */}
      <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full bg-ink-950 z-20" />

      <div className="relative rounded-[1.9rem] bg-ink-950 overflow-hidden h-[520px]">
        <div className="h-6" />
        <div className="relative h-[434px]">
          {keys.map((k, i) => {
            const Screen = SCREENS[k]
            return (
              <div
                key={k}
                data-screen={k}
                className={`absolute inset-0 overflow-hidden ${i > 0 ? 'opacity-0' : ''}`}
              >
                <Screen />
              </div>
            )
          })}
        </div>

        {/* Tab bar */}
        <div className="absolute bottom-0 inset-x-0 h-14 border-t border-ink-800 bg-ink-900/90 backdrop-blur grid grid-cols-5 items-center">
          {[Home, ClipboardList, null, TrendingUp, User].map((Icon, i) =>
            Icon ? (
              <div key={i} className={`flex justify-center ${i === 0 ? 'text-accent' : 'text-zinc-600'}`}>
                <Icon size={15} />
              </div>
            ) : (
              <div key={i} className="flex justify-center">
                <div className="-mt-6 w-10 h-10 rounded-xl bg-accent text-ink-950 flex items-center justify-center glow-accent">
                  <Plus size={18} strokeWidth={2.6} />
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  )
}
