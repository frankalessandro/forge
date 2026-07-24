import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { gsap, ScrollTrigger, createSectionContext, revealWords, revealOnScroll } from './gsapSetup'
import SplitHeading from './SplitHeading'

const FAQS = [
  {
    q: '¿Cuánto cuesta?',
    a: 'Nada. Forge es gratis y no tiene anuncios ni muros de pago para ver tu propio historial. Es un proyecto personal, no un negocio con inversores detrás.',
  },
  {
    q: '¿Necesito instalar algo?',
    a: 'No. Forge funciona en el navegador del celular o la computadora. Puedes agregarla a tu pantalla de inicio y se comporta como una app nativa, sin pasar por ninguna tienda.',
  },
  {
    q: '¿Sirve si soy principiante?',
    a: 'Sí, sobre todo. Puedes generar una rutina según tu objetivo y el catálogo trae la descripción y los músculos de cada ejercicio, así sabes qué estás haciendo y para qué.',
  },
  {
    q: '¿Y si uso libras o pulgadas?',
    a: 'Forge trabaja en kilogramos y centímetros, sin conversión. Es una decisión de diseño para mantener todo consistente y sin errores de redondeo entre unidades.',
  },
  {
    q: '¿Mis datos están seguros?',
    a: 'Cada usuario solo puede leer y escribir sus propios datos: está forzado a nivel de base de datos, no solo en la interfaz. Lo que compartes con amigos lo decides tú, sesión por sesión.',
  },
  {
    q: 'Está en desarrollo, ¿la puedo usar en serio?',
    a: 'Sí. La app funciona y se usa a diario. "En desarrollo" significa que siguen apareciendo funciones nuevas y mejoras, no que sea un experimento a medio hacer.',
  },
]

/**
 * Un ítem del acordeón. La apertura es CSS puro (`grid-template-rows: 0fr →
 * 1fr`, ver landing.css): llega a la altura real del contenido sin medirla en
 * JS. Antes cada toggle disparaba un tween de `height: auto`, que obliga a
 * GSAP a medir el destino y fuerza un reflow por apertura.
 */
function FaqItem({ item, isOpen, onToggle }) {
  return (
    <div data-faq className="border-b border-ink-800">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-6 text-left py-6 group"
      >
        <span
          className={`font-display font-semibold uppercase tracking-tight text-lg sm:text-xl transition-colors ${
            isOpen ? 'text-accent' : 'text-zinc-100 group-hover:text-accent'
          }`}
        >
          {item.q}
        </span>
        <span
          className={`shrink-0 w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-300 ${
            isOpen ? 'border-accent text-accent rotate-45' : 'border-ink-700 text-zinc-500'
          }`}
        >
          <Plus size={17} />
        </span>
      </button>

      <div className="faq-panel" data-open={isOpen}>
        <div>
          <p className="text-zinc-400 leading-relaxed pb-7 pr-12 max-w-3xl">{item.a}</p>
        </div>
      </div>
    </div>
  )
}

export default function LandingFaq() {
  const root = useRef(null)
  const [open, setOpen] = useState(0)

  // El acordeón cambia la altura de la página con una transición CSS (ver
  // `.faq-panel` en landing.css), pero la barra de progreso mide el scroll
  // total con un `end` calculado antes de esta interacción: sin este refresh
  // queda corto o largo apenas alguien abre o cierra una pregunta.
  useEffect(() => {
    const id = setTimeout(() => ScrollTrigger.refresh(), 380)
    return () => clearTimeout(id)
  }, [open])

  useLayoutEffect(() =>
    createSectionContext(root, () => {
      const q = gsap.utils.selector(root)
      revealWords(root.current)
      revealOnScroll(q('[data-faq]'), { y: 24, stagger: 0.06 })
    })
  , [])

  return (
    <section id="faq" ref={root} className="landing-section relative max-w-4xl mx-auto px-5 sm:px-8">
      <p className="section-title">Preguntas</p>
      <SplitHeading
        text="Lo que todos preguntan"
        as="h2"
        className="font-display font-bold uppercase tracking-tighter leading-[0.94] text-[clamp(2rem,5.5vw,4rem)] text-zinc-100 mt-4"
      />

      <div className="mt-12 border-t border-ink-800">
        {FAQS.map((f, i) => (
          <FaqItem key={f.q} item={f} isOpen={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
        ))}
      </div>
    </section>
  )
}
