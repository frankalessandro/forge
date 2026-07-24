import { useLayoutEffect, useRef } from 'react'
import { Check, Hammer, Sparkles } from 'lucide-react'
import { gsap, createSectionContext, revealWords } from './gsapSetup'
import SplitHeading from './SplitHeading'

const DONE = [
  'Sesiones de entrenamiento con cronómetro y descansos',
  'Catálogo de 1.359 ejercicios con imágenes',
  'Editor de rutinas y generador por objetivo',
  'Calendario semanal con excepciones',
  'Historial, volumen y gráficas de evolución',
  'Rachas, 51 logros y sistema de rangos',
  'Amigos, perfiles públicos y entrenamientos compartidos',
]

const NEXT = [
  'Estadísticas comparadas entre amigos',
  'Retos y competencias de grupo',
  'Plantillas de rutinas de la comunidad',
  'Notificaciones y recordatorios de entreno',
  'App instalable con modo offline completo',
]

function Item({ children, done }) {
  return (
    <li data-line-item className="flex items-start gap-3">
      <span
        className={`mt-0.5 shrink-0 rounded-lg p-1 ${
          done ? 'bg-accent/15 text-accent' : 'bg-ink-800 text-zinc-500'
        }`}
      >
        {done ? <Check size={14} strokeWidth={3} /> : <Sparkles size={14} />}
      </span>
      <span className={`text-sm leading-relaxed ${done ? 'text-zinc-300' : 'text-zinc-500'}`}>
        {children}
      </span>
    </li>
  )
}

export default function LandingRoadmap() {
  const root = useRef(null)

  useLayoutEffect(() =>
    createSectionContext(root, () => {
      const q = gsap.utils.selector(root)

      revealWords(root.current)

      // Los dos paneles están lado a lado: entran con un único trigger y una
      // única timeline en vez de cuatro (dos por panel, midiendo lo mismo).
      const panels = q('[data-panel]')
      const items = q('[data-line-item]')
      gsap.set(panels, { autoAlpha: 0, y: 44 })
      gsap.set(items, { autoAlpha: 0, x: -12 })

      gsap.timeline({ scrollTrigger: { trigger: panels[0], start: 'top 85%', once: true } })
        .to(panels, { autoAlpha: 1, y: 0, stagger: 0.1, clearProps: 'transform' })
        .to(items, { autoAlpha: 1, x: 0, duration: 0.45, stagger: 0.04, clearProps: 'transform' }, '-=0.5')
    })
  , [])

  return (
    <section id="roadmap" ref={root} className="landing-section relative overflow-hidden">
      <div aria-hidden className="glow top-1/3 -left-40 w-[500px] h-[500px]" style={{ '--glow': '10%' }} />

      <div className="landing-wrap relative">
        <div className="inline-flex items-center gap-2 chip-accent">
          <Hammer size={13} />
          Work in progress
        </div>

        <SplitHeading
          text="Forge se está forjando"
          as="h2"
          className="font-display font-bold uppercase tracking-tighter leading-[0.94] text-[clamp(2.2rem,6vw,4.5rem)] text-zinc-100 mt-5 max-w-3xl"
        />
        <p className="landing-lead text-zinc-400">
          Esto no es una demo ni una landing de humo: la app funciona y se usa todos los días.
          Pero está en desarrollo activo, así que vas a ver cosas cambiar, mejorar y aparecer
          seguido. Si algo se rompe, se arregla rápido. Entrar ahora significa ver Forge crecer
          desde adentro.
        </p>

        <div className="grid md:grid-cols-2 gap-5 mt-14">
          <div data-panel className="card p-7 sm:p-8 border-accent/25">
            <div className="flex items-center justify-between">
              <h3 className="display text-lg text-zinc-100">Ya funciona</h3>
              <span className="chip-accent">Live</span>
            </div>
            <ul className="space-y-3.5 mt-6">
              {DONE.map((d) => (
                <Item key={d} done>
                  {d}
                </Item>
              ))}
            </ul>
          </div>

          <div data-panel className="card p-7 sm:p-8">
            <div className="flex items-center justify-between">
              <h3 className="display text-lg text-zinc-100">En el horno</h3>
              <span className="chip-muted">Próximo</span>
            </div>
            <ul className="space-y-3.5 mt-6">
              {NEXT.map((n) => (
                <Item key={n}>{n}</Item>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
