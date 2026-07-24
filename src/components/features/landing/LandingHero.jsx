import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowRight, Flame, Trophy, Timer } from 'lucide-react'
import { gsap, createSectionContext } from './gsapSetup'
import SplitHeading from './SplitHeading'

/** Tarjetas "vivas" que flotan a la derecha: un vistazo de la app real. */
const FLOATING = [
  { icon: Flame, top: '4%', right: '3%', label: 'Racha', value: '7 sem', hint: 'No la rompas' },
  { icon: Timer, top: '38%', right: '28%', label: 'Press de banca', value: '80 kg × 8', hint: 'Serie 3 · descanso 90"' },
  { icon: Trophy, top: '68%', right: '1%', label: 'Nuevo récord', value: '+5 kg', hint: 'Sentadilla · 100 kg' },
]

export default function LandingHero() {
  const root = useRef(null)

  useLayoutEffect(() =>
    createSectionContext(root, () => {
      const q = gsap.utils.selector(root)

      // Estado inicial: se setea acá (no en CSS) para que sin JS la landing
      // siga siendo legible y no quede todo invisible.
      gsap.set(q('[data-hero-fade]'), { autoAlpha: 0, y: 24 })
      gsap.set(q('[data-float-wrap]'), { autoAlpha: 0, scale: 0.94 })
      gsap.set(q('[data-word]'), { autoAlpha: 0, y: '0.4em' })

      // Una sola timeline para toda la entrada. Al terminar, `clearProps`
      // devuelve los elementos a un render normal: nada queda con un
      // transform propio ocupando una capa de composición para siempre.
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.from(q('[data-glow]'), { autoAlpha: 0, duration: 1.2 })
        .to(q('[data-word]'), { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.06, clearProps: 'transform' }, 0.15)
        .to(q('[data-hero-fade]'), { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.08, clearProps: 'transform' }, '-=0.6')
        .to(q('[data-float-wrap]'), { autoAlpha: 1, scale: 1, duration: 0.7, stagger: 0.1, clearProps: 'transform' }, '-=0.5')

      // Un único parallax, sobre el contenido. Antes eran tres tweens con
      // scrub (contenido, palabra fantasma y halo), o sea tres recálculos por
      // frame de scroll durante toda la primera pantalla.
      gsap.to(q('[data-hero-content]'), {
        y: -80,
        autoAlpha: 0,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      })
    })
  , [])

  return (
    <section
      ref={root}
      data-no-rescue
      className="relative min-h-[100svh] flex items-center overflow-hidden pt-28 pb-24 sm:pt-32"
    >
      {/* Grilla de fondo, desvanecida hacia los bordes */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff08 1px, transparent 1px), linear-gradient(to bottom, #ffffff08 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, #000 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, #000 40%, transparent 100%)',
        }}
      />

      {/* Halo: gradiente radial en vez de un `blur-[140px]` sobre una capa de
          900px, que el navegador tenía que desenfocar en cada repintado. */}
      <div
        data-glow
        aria-hidden
        className="glow -top-32 left-1/2 -translate-x-1/2 w-[min(900px,140vw)] aspect-square"
        style={{ '--glow': '15%' }}
      />

      <span
        data-ghost-word
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-display font-bold uppercase leading-none text-[26vw] tracking-tighter text-transparent select-none"
        style={{ WebkitTextStroke: '1px #ffffff0d' }}
      >
        Forge
      </span>

      <div className="landing-wrap relative">
        <div data-hero-content className="max-w-3xl">
          <div data-hero-fade className="inline-flex items-center gap-2 chip-accent">
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inline-flex w-full h-full rounded-full bg-accent animate-ping opacity-75" />
              <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-accent" />
            </span>
            En desarrollo activo · v0
          </div>

          {/* `leading-[0.92]`: con 0.88 la tilde de una mayúscula acentuada se
              metía en la línea de arriba. */}
          <SplitHeading
            text="Forja tu"
            className="font-display font-bold uppercase tracking-tighter leading-[0.92] text-[clamp(3rem,12vw,8rem)] text-zinc-100 mt-7"
          />
          <SplitHeading
            text="progreso"
            as="p"
            className="font-display font-bold uppercase tracking-tighter leading-[0.92] text-[clamp(3rem,12vw,8rem)] text-accent"
          />

          <p data-hero-fade className="landing-lead text-base sm:text-xl text-zinc-400 max-w-xl">
            El registro de gimnasio que se siente como entrenar y no como llenar una planilla.
            Anota cada serie, mira tu evolución real y compite sano con tus amigos.
          </p>

          <div data-hero-fade className="flex flex-wrap items-center gap-3 mt-9">
            <Link to="/register" className="btn-accent px-7 py-4 text-sm group">
              Crear mi cuenta gratis
              <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#showcase" className="btn-dark px-7 py-4 text-sm font-display uppercase tracking-wide">
              Ver la app por dentro
            </a>
          </div>

          <p data-hero-fade className="eyebrow mt-8">
            Gratis · Sin anuncios · Sin tarjeta · kg y cm
          </p>
        </div>

        {/* Tarjetas flotantes (solo desktop: en móvil taparían el texto).
            La deriva es un keyframe de CSS y no tres tweens infinitos de GSAP:
            se pausa sola al salir de pantalla y no ocupa el ticker. El wrapper
            existe para que la entrada y el flotar no se peleen el transform. */}
        <div aria-hidden className="hidden lg:block absolute inset-0 pointer-events-none">
          {FLOATING.map((card, i) => (
            <div
              key={card.label}
              data-float-wrap
              className="absolute w-60"
              style={{ top: card.top, right: card.right }}
            >
              <div
                className="float-card rounded-2xl border border-ink-700 bg-ink-900/90 p-4 shadow-2xl shadow-black/50"
                style={{ '--dur': `${6.5 + i}s`, '--delay': `${i * 0.8}s` }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-accent/15 text-accent p-1.5">
                    <card.icon size={15} />
                  </div>
                  <span className="eyebrow">{card.label}</span>
                </div>
                <p className="stat-num text-2xl text-zinc-100 mt-2.5">{card.value}</p>
                <p className="text-xs text-zinc-500 mt-1">{card.hint}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <a
        href="#problem"
        aria-label="Bajar"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-zinc-600 hover:text-accent transition-colors"
      >
        <ArrowDown className="nudge" size={22} />
      </a>
    </section>
  )
}
