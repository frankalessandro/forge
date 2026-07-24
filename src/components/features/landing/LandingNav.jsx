import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Dumbbell } from 'lucide-react'
import { gsap, ScrollTrigger, createSectionContext } from './gsapSetup'
import GithubIcon from './GithubIcon'

const LINKS = [
  { href: '#showcase', label: 'La app' },
  { href: '#features', label: 'Qué trae' },
  { href: '#dev', label: 'Quién la hace' },
  { href: '#faq', label: 'Preguntas' },
]

export default function LandingNav() {
  const root = useRef(null)

  useLayoutEffect(() =>
    createSectionContext(root, () => {
      gsap.from(root.current, {
        y: -60,
        autoAlpha: 0,
        duration: 0.9,
        delay: 0.15,
        ease: 'power3.out',
        clearProps: 'transform',
      })

      // Al despegarse del hero, la barra gana fondo y borde.
      ScrollTrigger.create({
        start: 'top -60',
        end: 99999,
        toggleClass: { targets: root.current, className: 'nav-scrolled' },
      })
    })
  , [])

  return (
    <header
      ref={root}
      className="fixed top-0 inset-x-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 border-b border-transparent [&.nav-scrolled]:bg-ink-950/80 [&.nav-scrolled]:backdrop-blur-xl [&.nav-scrolled]:border-ink-800"
    >
      <div className="landing-wrap h-16 sm:h-20 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center group-hover:glow-accent transition-shadow">
            <Dumbbell size={18} className="text-ink-950" strokeWidth={2.6} />
          </div>
          <span className="font-display font-bold uppercase tracking-[0.18em] text-lg text-zinc-100">
            Forge
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-display uppercase tracking-[0.15em] text-[11px] font-semibold text-zinc-500 hover:text-accent transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="https://github.com/frankalessandro/forge"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ver el repositorio en GitHub"
            className="hidden sm:flex w-9 h-9 rounded-xl border border-ink-700 items-center justify-center text-zinc-400 hover:text-accent hover:border-accent/40 transition-colors"
          >
            <GithubIcon size={16} />
          </a>
          <Link
            to="/register"
            className="hidden sm:inline-flex font-display uppercase tracking-wide text-xs font-semibold text-zinc-400 hover:text-zinc-100 transition-colors px-2"
          >
            Crear cuenta
          </Link>
          <Link to="/login" className="btn-accent px-5 py-2.5 text-xs sm:text-sm">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </header>
  )
}
