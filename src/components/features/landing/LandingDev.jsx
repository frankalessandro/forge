import { useLayoutEffect, useRef, useState } from 'react'
import { ArrowUpRight, Globe, Code2 } from 'lucide-react'
import { gsap, createSectionContext, revealWords, revealOnScroll } from './gsapSetup'
import SplitHeading from './SplitHeading'
import GithubIcon from './GithubIcon'

const GITHUB_USER = 'frankalessandro'
const LINKS = [
  { icon: Globe, label: 'Mi web', value: 'alessandro-web.vercel.app', href: 'https://alessandro-web.vercel.app/' },
  { icon: GithubIcon, label: 'GitHub', value: `@${GITHUB_USER}`, href: `https://github.com/${GITHUB_USER}` },
  { icon: Code2, label: 'Repo de Forge', value: `${GITHUB_USER}/forge`, href: `https://github.com/${GITHUB_USER}/forge` },
]

const STACK = ['React 19', 'Vite', 'Supabase', 'Tailwind', 'React Router', 'Zustand']

export default function LandingDev() {
  const root = useRef(null)
  // Si el avatar de GitHub no carga, cae al monograma sin dejar un hueco roto.
  const [avatarFailed, setAvatarFailed] = useState(false)

  useLayoutEffect(() =>
    createSectionContext(root, () => {
      const q = gsap.utils.selector(root)
      revealWords(root.current)

      // Sin `rotateX`: girar en 3D una tarjeta de este tamaño la manda a una
      // capa aparte y obliga a rasterizarla de nuevo en cada frame, para un
      // efecto que casi no se percibe.
      revealOnScroll(q('[data-dev-card]'), { y: 48 })
      revealOnScroll(q('[data-dev-link]'), { y: 20, stagger: 0.09 })
    })
  , [])

  return (
    <section id="dev" ref={root} className="landing-section landing-wrap relative">
      <p className="section-title">Quién está detrás</p>
      <SplitHeading
        text="Un dev, un gimnasio,
un proyecto"
        as="h2"
        className="font-display font-bold uppercase tracking-tighter leading-[0.94] text-[clamp(2rem,5.5vw,4rem)] text-zinc-100 mt-4"
      />

      <div data-dev-card className="relative overflow-hidden card p-7 sm:p-10 mt-12">
        <div aria-hidden className="glow -top-32 -right-24 w-96 h-96" style={{ '--glow': '14%' }} />

        <div className="relative flex flex-col sm:flex-row gap-7 sm:gap-9 items-start">
          {/* Avatar */}
          <div className="shrink-0">
            {avatarFailed ? (
              <div className="w-24 h-24 rounded-3xl bg-accent text-ink-950 flex items-center justify-center font-display font-bold text-3xl">
                FA
              </div>
            ) : (
              <img
                src={`https://github.com/${GITHUB_USER}.png?size=200`}
                alt="Frank Alessandro Roldán"
                width={96}
                height={96}
                loading="lazy"
                onError={() => setAvatarFailed(true)}
                className="w-24 h-24 rounded-3xl object-cover border border-ink-700"
              />
            )}
          </div>

          <div className="min-w-0">
            <h3 className="font-display font-bold uppercase tracking-tight text-2xl sm:text-3xl text-zinc-100">
              Frank Alessandro Roldán
            </h3>
            <p className="eyebrow text-accent mt-2">Desarrollador y creador de Forge</p>

            <p className="text-zinc-400 leading-relaxed mt-5 max-w-xl">
              Forge lo desarrollo yo solo: diseño, frontend, base de datos y despliegue.
              Nació de una necesidad propia —querer llevar un registro serio del gimnasio sin
              pelearme con una app llena de anuncios— y hoy sigue creciendo entreno tras entreno.
              Si tienes una idea o encuentras un error, escríbeme: se lee todo.
            </p>

            <div className="flex flex-wrap gap-2 mt-6">
              {STACK.map((s) => (
                <span key={s} className="chip-muted">
                  {s}
                </span>
              ))}
            </div>

            <div className="grid sm:grid-cols-3 gap-3 mt-8">
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  data-dev-link
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-2xl border border-ink-700 bg-ink-850 px-4 py-3.5 hover:border-accent/40 hover:bg-ink-800 transition-colors"
                >
                  <l.icon size={17} className="text-accent shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-display uppercase tracking-[0.15em] text-zinc-500">
                      {l.label}
                    </p>
                    <p className="text-xs text-zinc-200 truncate">{l.value}</p>
                  </div>
                  <ArrowUpRight
                    size={15}
                    className="text-zinc-600 group-hover:text-accent group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all shrink-0"
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
