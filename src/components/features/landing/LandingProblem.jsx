import { useLayoutEffect, useRef } from 'react'
import { X, Check } from 'lucide-react'
import { gsap, createSectionContext, revealWords, revealOnScroll } from './gsapSetup'
import SplitHeading from './SplitHeading'

const BEFORE = [
  'Notas del celular con "banca 80x8x3" y nada más',
  'Nunca recuerdas cuánto levantaste el mes pasado',
  'La planilla de Excel que abriste tres veces',
  'Cero idea de si estás progresando o estancado',
  'Apps que te cobran por ver tu propio historial',
]

const AFTER = [
  'Cada serie queda registrada en dos toques',
  'Historial completo, por ejercicio y por fecha',
  'Rutinas y calendario que se arman una sola vez',
  'Gráficas que te dicen si subiste o te frenaste',
  'Gratis, sin anuncios y sin muros de pago',
]

export default function LandingProblem() {
  const root = useRef(null)

  useLayoutEffect(() =>
    createSectionContext(root, () => {
      const q = gsap.utils.selector(root)
      revealWords(root.current)

      // Los dos paneles entran juntos con un solo ScrollTrigger y una sola
      // timeline. Antes eran cuatro triggers (panel, panel, lista, lista) que
      // medían lo mismo. La rotación del panel "antes" se quitó: obligaba a
      // rasterizar de nuevo una tarjeta grande durante toda la entrada.
      const panels = q('[data-panel]')
      const items = q('[data-list] li')
      gsap.set(panels, { autoAlpha: 0, y: 56 })
      gsap.set(items, { autoAlpha: 0, x: -10 })

      const tl = gsap.timeline({
        scrollTrigger: { trigger: q('[data-panels]')[0], start: 'top 80%', once: true },
      })
      tl.to(panels, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.12, clearProps: 'transform' })
        .to(items, { autoAlpha: 1, x: 0, duration: 0.45, stagger: 0.05, clearProps: 'transform' }, '-=0.5')

      revealOnScroll(q('[data-punch]'), { y: 30 })
    })
  , [])

  return (
    <section id="problem" ref={root} className="landing-section landing-wrap relative">
      <p className="section-title">Por qué existe Forge</p>
      <SplitHeading
        text="Entrenas fuerte.
Anotas mal."
        as="h2"
        className="font-display font-bold uppercase tracking-tighter leading-[0.94] text-[clamp(2.2rem,6.5vw,4.8rem)] text-zinc-100 mt-4"
      />
      <p className="landing-lead text-zinc-400">
        El esfuerzo lo pones en el gimnasio. El problema es lo que pasa después: los datos
        se pierden y sin datos no hay progreso medible. Forge existe para cerrar esa brecha.
      </p>

      <div data-panels className="grid md:grid-cols-2 gap-5 mt-14 items-start">
        <div data-panel className="rounded-3xl border border-ink-800 bg-ink-900/60 p-7 sm:p-8">
          <span className="chip-muted">Antes</span>
          <h3 className="font-display font-bold uppercase tracking-tight text-2xl text-zinc-500 mt-4">
            El método de siempre
          </h3>
          <ul data-list className="space-y-3.5 mt-6">
            {BEFORE.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 rounded-lg bg-ink-800 text-zinc-600 p-1">
                  <X size={14} strokeWidth={3} />
                </span>
                <span className="text-sm text-zinc-500 leading-relaxed line-through decoration-zinc-700">
                  {b}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div
          data-panel
          className="relative rounded-3xl border border-accent/30 bg-ink-900 p-7 sm:p-8 overflow-hidden"
        >
          <div aria-hidden className="glow -top-24 -right-24 w-72 h-72" style={{ '--glow': '16%' }} />
          <div className="relative">
            <span className="chip-accent">Con Forge</span>
            <h3 className="font-display font-bold uppercase tracking-tight text-2xl text-zinc-100 mt-4">
              Todo queda medido
            </h3>
            <ul data-list className="space-y-3.5 mt-6">
              {AFTER.map((a) => (
                <li key={a} className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 rounded-lg bg-accent/15 text-accent p-1">
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <span className="text-sm text-zinc-300 leading-relaxed">{a}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <p
        data-punch
        className="font-display font-bold uppercase tracking-tight text-center text-xl sm:text-3xl text-zinc-100 mt-16"
      >
        Lo que no se mide, <span className="text-accent">no se mejora</span>.
      </p>
    </section>
  )
}
