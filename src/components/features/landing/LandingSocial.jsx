import { useLayoutEffect, useRef } from 'react'
import { Users, Eye, AtSign, Lock } from 'lucide-react'
import { gsap, createSectionContext, revealWords, revealOnScroll } from './gsapSetup'
import SplitHeading from './SplitHeading'

const POINTS = [
  {
    icon: AtSign,
    title: 'Te encuentran por tu usuario',
    text: 'Elige tu @usuario y tus amigos te agregan sin buscar tu correo ni pasarte un código raro.',
  },
  {
    icon: Eye,
    title: 'Miras sus entrenamientos',
    text: 'Qué hicieron, con cuánto peso y cuántas series. Ideal para copiar lo que funciona y picarse un poco.',
  },
  {
    icon: Lock,
    title: 'Tú decides qué se ve',
    text: 'Cada sesión puede ser pública o privada. Si un día entrenaste mal, nadie tiene por qué enterarse.',
  },
]

const FEED = [
  { name: 'Diego', tag: '@diego', action: 'terminó Push A', detail: '6 ejercicios · 5,2 t', time: 'hace 2 h' },
  { name: 'Sofía', tag: '@sofi', action: 'batió un récord', detail: 'Peso muerto 95 kg', time: 'hace 5 h' },
  { name: 'Martín', tag: '@martin', action: 'lleva 14 semanas', detail: 'Racha más larga del grupo', time: 'ayer' },
]

export default function LandingSocial() {
  const root = useRef(null)

  useLayoutEffect(() =>
    createSectionContext(root, () => {
      const q = gsap.utils.selector(root)
      revealWords(root.current)
      revealOnScroll(q('[data-point]'), { y: 30, stagger: 0.1 })

      // El feed entra en cascada, como si fuera llegando en vivo.
      const rows = q('[data-feed-row]')
      gsap.set(rows, { autoAlpha: 0, x: 32 })
      gsap.to(rows, {
        autoAlpha: 1,
        x: 0,
        duration: 0.6,
        stagger: 0.12,
        clearProps: 'transform',
        scrollTrigger: { trigger: rows[0], start: 'top 85%', once: true },
      })
    })
  , [])

  return (
    <section ref={root} className="landing-section relative overflow-hidden">
      <div aria-hidden className="glow bottom-0 left-1/4 w-[480px] h-[480px]" style={{ '--glow': '10%' }} />

      <div className="landing-wrap relative">
        <div className="inline-flex items-center gap-2 chip-accent">
          <Users size={13} />
          Modo grupo
        </div>
        <SplitHeading
          text="El gimnasio en grupo
pega distinto"
          as="h2"
          className="font-display font-bold uppercase tracking-tighter leading-[0.94] text-[clamp(2.2rem,6vw,4.5rem)] text-zinc-100 mt-5"
        />

        <div className="grid lg:grid-cols-2 gap-14 lg:gap-16 mt-14 items-center">
          <div className="space-y-8">
            {POINTS.map((p) => (
              <div key={p.title} data-point className="flex gap-4">
                <div className="w-11 h-11 shrink-0 rounded-2xl bg-accent/12 text-accent flex items-center justify-center">
                  <p.icon size={19} />
                </div>
                <div>
                  <h3 className="font-display font-bold uppercase tracking-tight text-lg text-zinc-100">
                    {p.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed mt-1.5 max-w-md">{p.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Feed simulado */}
          <div className="card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <p className="section-title">Tus amigos</p>
              <span className="chip-accent">3 activos</span>
            </div>
            <div className="space-y-3">
              {FEED.map((f) => (
                <div
                  key={f.tag}
                  data-feed-row
                  className="flex items-center gap-3.5 rounded-2xl bg-ink-850 border border-ink-800 px-4 py-3.5"
                >
                  <div className="w-10 h-10 shrink-0 rounded-full bg-ink-800 border border-ink-700 flex items-center justify-center font-display font-bold text-sm text-accent">
                    {f.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-100 truncate">
                      <span className="font-semibold">{f.name}</span>{' '}
                      <span className="text-zinc-500">{f.action}</span>
                    </p>
                    <p className="text-xs text-zinc-500 truncate">
                      {f.detail} · {f.time}
                    </p>
                  </div>
                  <span className="text-[10px] font-display uppercase tracking-wider text-zinc-600 shrink-0">
                    {f.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
