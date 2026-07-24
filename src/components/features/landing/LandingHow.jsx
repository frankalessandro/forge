import { useLayoutEffect, useRef } from 'react'
import { gsap, createSectionContext, revealWords, revealBatch } from './gsapSetup'
import SplitHeading from './SplitHeading'

const STEPS = [
  {
    step: 'Uno',
    title: 'Cuéntanos quién eres',
    text: 'Altura, peso, objetivo y experiencia. Con eso Forge sabe qué proponerte y desde dónde medir tu progreso. Toma menos de un minuto.',
  },
  {
    step: 'Dos',
    title: 'Arma o elige tu rutina',
    text: 'Creas tu rutina desde cero o generas una según tu objetivo. La asignas a los días de la semana y se acabó la planificación.',
  },
  {
    step: 'Tres',
    title: 'Entrena y registra',
    text: 'Abres la sesión, cargas las series mientras descansas y cierras. Todo lo demás —racha, logros, gráficas, récords— se actualiza solo.',
  },
]

export default function LandingHow() {
  const root = useRef(null)

  useLayoutEffect(() =>
    createSectionContext(root, () => {
      const q = gsap.utils.selector(root)

      revealWords(root.current)

      // La línea vertical se "dibuja" siguiendo el scroll. Es el único scrub
      // que queda fuera del hero y de los dos pines: anima una sola propiedad
      // sobre un elemento de 1px de ancho.
      gsap.fromTo(
        q('[data-line]'),
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          transformOrigin: 'top center',
          scrollTrigger: {
            trigger: q('[data-how-steps]')[0],
            start: 'top 70%',
            end: 'bottom 70%',
            scrub: 0.6,
          },
        },
      )

      revealBatch(q('[data-how-step]'), { y: 28, start: 'top 82%' })
    })
  , [])

  return (
    <section id="how" ref={root} className="landing-section landing-wrap relative">
      <p className="section-title">Cómo funciona</p>
      <SplitHeading
        text="Tres pasos y a entrenar."
        as="h2"
        className="font-display font-bold uppercase tracking-tighter leading-[0.94] text-[clamp(2.2rem,6vw,4.5rem)] text-zinc-100 mt-4 max-w-3xl"
      />

      <div data-how-steps className="relative mt-16 pl-10 sm:pl-16">
        {/* Riel + línea que se dibuja */}
        <div className="absolute left-[13px] sm:left-[23px] top-2 bottom-2 w-px bg-ink-800" />
        <div data-line className="absolute left-[13px] sm:left-[23px] top-2 bottom-2 w-px bg-accent origin-top" />

        <div className="space-y-14 sm:space-y-20">
          {STEPS.map((s, i) => (
            <div key={s.title} data-how-step className="relative">
              <span className="absolute -left-10 sm:-left-16 top-1 flex items-center justify-center w-7 h-7 sm:w-12 sm:h-12 rounded-full bg-ink-950 border border-accent text-accent font-display font-bold text-xs sm:text-base">
                {i + 1}
              </span>
              <p className="eyebrow text-accent">Paso {s.step}</p>
              <h3 className="font-display font-bold uppercase tracking-tight text-2xl sm:text-3xl text-zinc-100 mt-2">
                {s.title}
              </h3>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed mt-3 max-w-xl">
                {s.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
