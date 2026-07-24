import { useLayoutEffect, useRef } from 'react'
import { Flame, Trophy, Medal, Zap, Target, Repeat } from 'lucide-react'
import { gsap, createSectionContext, revealWords, revealOnScroll } from './gsapSetup'
import SplitHeading from './SplitHeading'

const BADGES = [
  { icon: Flame, name: 'Imparable', hint: '12 semanas seguidas' },
  { icon: Target, name: 'Club de los 100', hint: '100 kg en sentadilla' },
  { icon: Repeat, name: 'Rutinario', hint: '50 entrenamientos' },
  { icon: Zap, name: 'Tonelada', hint: '10.000 kg movidos' },
  { icon: Medal, name: 'Rompe marcas', hint: '25 récords personales' },
  { icon: Trophy, name: 'Veterano', hint: '1 año entrenando' },
]

export default function LandingGamification() {
  const root = useRef(null)

  useLayoutEffect(() =>
    createSectionContext(root, () => {
      const q = gsap.utils.selector(root)
      revealWords(root.current)
      revealOnScroll(q('[data-reveal]'), { y: 36 })

      // Medallas y barra de XP comparten un ScrollTrigger: están en la misma
      // pantalla, así que medir dos veces lo mismo no aportaba nada. El rebote
      // `back.out(2)` se cambió por una entrada limpia: escalar seis tarjetas
      // con overshoot obliga a rasterizarlas de nuevo en cada frame.
      const badges = q('[data-badge]')
      const bar = q('[data-xp-bar]')[0]
      gsap.set(badges, { autoAlpha: 0, y: 18 })

      const tl = gsap.timeline({
        scrollTrigger: { trigger: badges[0], start: 'top 88%', once: true },
      })
      tl.to(badges, {
        autoAlpha: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.05,
        clearProps: 'transform',
      })
      // La barra se llena con una transición de CSS (`width` sobre un
      // contenedor con `overflow: hidden`): no necesita un tween propio.
      if (bar) tl.add(() => { bar.style.width = '68%' }, 0)
    })
  , [])

  return (
    <section ref={root} className="landing-section landing-wrap relative">
      <p className="section-title">Constancia, no motivación</p>
      {/* `leading-[0.94]`: "MAÑANA" es la palabra donde más se notaba: la ~ de
          la Ñ mayúscula quedaba recortada contra la línea de arriba. */}
      <SplitHeading
        text="Que volver mañana
sea lo natural"
        as="h2"
        className="font-display font-bold uppercase tracking-tighter leading-[0.94] text-[clamp(2.2rem,6vw,4.5rem)] text-zinc-100 mt-4"
      />
      <p data-reveal className="landing-lead text-zinc-400">
        La motivación se acaba en febrero. Forge apuesta al sistema: rachas que se cuentan por
        semana (no por día, para que un día libre no arruine nada), logros que se desbloquean
        solos y rangos que suben mientras entrenas.
      </p>

      <div className="grid lg:grid-cols-5 gap-5 mt-14">
        {/* Racha */}
        <div data-reveal className="lg:col-span-2 card p-8 relative overflow-hidden flex flex-col justify-between">
          {/* Aro decorativo. Antes latía en bucle con un tween infinito: un
              movimiento que nadie mira y que mantenía viva la sección entera
              en el ticker de GSAP aunque estuviera fuera de pantalla. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -right-16 w-56 h-56 rounded-full border-2 border-accent/20"
          />
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-accent/12 text-accent flex items-center justify-center">
              <Flame size={22} />
            </div>
            <p className="stat-num text-6xl text-zinc-100 mt-6">
              7<span className="text-2xl text-zinc-500 ml-2">semanas</span>
            </p>
            <p className="display text-sm text-zinc-100 mt-3">Racha activa</p>
            <p className="text-sm text-zinc-500 mt-1 max-w-xs">
              Entrena una vez por semana y la cadena sigue. Simple de mantener, difícil de soltar.
            </p>
          </div>
        </div>

        {/* Rango + XP */}
        <div data-reveal className="lg:col-span-3 card p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Tu rango</p>
              <p className="font-display font-bold uppercase tracking-tight text-3xl text-accent mt-1">
                Acero
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-accent/12 text-accent flex items-center justify-center shrink-0">
              <Medal size={22} />
            </div>
          </div>

          <div className="mt-7">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Progreso al siguiente rango</span>
              <span className="stat-num text-accent text-sm">2.856 XP</span>
            </div>
            <div className="h-2.5 rounded-full bg-ink-800 mt-2 overflow-hidden">
              <div
                data-xp-bar
                className="h-full w-0 rounded-full bg-accent transition-[width] duration-[1300ms] ease-out"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-7">
            {[
              ['51', 'Logros'],
              ['8', 'Categorías'],
              ['12', 'Rangos'],
            ].map(([v, l]) => (
              <div key={l} className="rounded-xl bg-ink-850 border border-ink-800 px-3 py-3 text-center">
                <p className="stat-num text-xl text-zinc-100">{v}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Medallas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5">
        {BADGES.map((b) => (
          <div
            key={b.name}
            data-badge
            className="card card-hover p-4 text-center group"
          >
            <div className="w-10 h-10 mx-auto rounded-xl bg-accent/12 text-accent flex items-center justify-center group-hover:bg-accent group-hover:text-ink-950 transition-colors">
              <b.icon size={18} />
            </div>
            <p className="display text-xs text-zinc-100 mt-3">{b.name}</p>
            <p className="text-[10px] text-zinc-500 mt-1 leading-snug">{b.hint}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
