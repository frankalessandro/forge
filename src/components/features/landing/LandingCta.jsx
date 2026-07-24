import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Dumbbell } from 'lucide-react'
import { gsap, createSectionContext, revealWords, revealOnScroll } from './gsapSetup'
import SplitHeading from './SplitHeading'

export default function LandingCta() {
  const root = useRef(null)

  useLayoutEffect(() =>
    createSectionContext(root, () => {
      const q = gsap.utils.selector(root)

      // Mismo criterio que el resto de la landing: estado inicial explícito y
      // reproducción inmediata si la sección ya está a la vista al montar.
      // `revealOnScroll` ya resuelve las dos cosas, así que el panel usa el
      // mismo camino que todo lo demás en vez de su propia timeline pausada
      // con un ScrollTrigger aparte.
      revealOnScroll(q('[data-panel]'), { y: 32, start: 'top 80%' })
      revealWords(root.current, { start: 'top 80%' })
      revealOnScroll(q('[data-cta-fade]'), { y: 24, stagger: 0.1, start: 'top 90%' })

      // La mancuerna de fondo ya no gira con el scroll: era un scrub sobre un
      // ícono de 420px (una capa grande a rasterizar de nuevo en cada frame)
      // para un giro de 25 grados que se pierde detrás del texto.
    })
  , [])

  return (
    <section ref={root} className="landing-wrap pb-20 sm:pb-28">
      <div
        data-panel
        className="relative overflow-hidden rounded-[2rem] bg-accent text-ink-950 px-7 py-16 sm:px-16 sm:py-24 glow-accent"
      >
        <Dumbbell
          aria-hidden
          size={420}
          strokeWidth={1}
          className="pointer-events-none absolute -right-24 -bottom-32 opacity-[0.13] rotate-[12deg]"
        />

        <div className="relative">
          <p className="font-display uppercase tracking-[0.2em] text-[11px] font-bold opacity-60">
            Empieza hoy
          </p>
          <SplitHeading
            text="Deja de anotar
en las notas"
            as="h2"
            className="font-display font-bold uppercase tracking-tighter leading-[0.92] text-[clamp(2.4rem,8vw,6rem)] mt-5"
          />
          <p data-cta-fade className="text-base sm:text-lg text-ink-950/70 max-w-md mt-7 leading-relaxed">
            Crea tu cuenta en menos de un minuto y sal del gimnasio hoy con tu primer
            entrenamiento registrado. Gratis, sin tarjeta y sin anuncios.
          </p>

          <div data-cta-fade className="flex flex-wrap gap-3 mt-9">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-7 py-4 bg-ink-950 text-accent font-display font-semibold uppercase tracking-wide text-sm hover:gap-3 active:scale-[0.98] transition-all"
            >
              Crear mi cuenta
              <ArrowRight size={17} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-7 py-4 border border-ink-950/25 text-ink-950 font-display font-semibold uppercase tracking-wide text-sm hover:bg-ink-950/10 active:scale-[0.98] transition-all"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
