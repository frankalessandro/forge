import { Dumbbell } from 'lucide-react'

/** Pantalla de carga con la marca, mientras se resuelve el estado de auth. */
export default function Splash() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-ink-950 flex flex-col items-center justify-center">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full bg-accent/15 blur-[130px]" />
      <div className="relative flex flex-col items-center animate-pulse">
        <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center glow-accent">
          <Dumbbell size={28} className="text-ink-950" strokeWidth={2.5} />
        </div>
        <p className="font-display font-bold uppercase tracking-[0.15em] text-3xl text-zinc-100 mt-4 leading-none">
          Forge
        </p>
      </div>
    </div>
  )
}
