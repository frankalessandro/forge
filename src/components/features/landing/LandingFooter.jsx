import { Link } from 'react-router-dom'
import { Dumbbell, Globe } from 'lucide-react'
import GithubIcon from './GithubIcon'

export default function LandingFooter() {
  return (
    <footer className="border-t border-ink-800">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 grid gap-10 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
              <Dumbbell size={18} className="text-ink-950" strokeWidth={2.6} />
            </div>
            <p className="font-display font-bold uppercase tracking-[0.18em] text-base text-zinc-100">
              Forge
            </p>
          </div>
          <p className="text-sm text-zinc-500 mt-4 max-w-sm leading-relaxed">
            Registro de gimnasio personal y para grupos de amigos. Hecho por una persona, en
            desarrollo activo, sin anuncios ni suscripciones.
          </p>
          <div className="flex items-center gap-2 mt-5">
            <a
              href="https://github.com/frankalessandro/forge"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Repositorio en GitHub"
              className="w-9 h-9 rounded-xl border border-ink-700 flex items-center justify-center text-zinc-400 hover:text-accent hover:border-accent/40 transition-colors"
            >
              <GithubIcon size={16} />
            </a>
            <a
              href="https://alessandro-web.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Web del desarrollador"
              className="w-9 h-9 rounded-xl border border-ink-700 flex items-center justify-center text-zinc-400 hover:text-accent hover:border-accent/40 transition-colors"
            >
              <Globe size={16} />
            </a>
          </div>
        </div>

        <nav className="grid grid-cols-2 gap-x-12 gap-y-2.5 text-sm sm:text-right">
          <a href="#showcase" className="text-zinc-500 hover:text-zinc-200 transition-colors">La app</a>
          <a href="#features" className="text-zinc-500 hover:text-zinc-200 transition-colors">Qué trae</a>
          <a href="#dev" className="text-zinc-500 hover:text-zinc-200 transition-colors">Quién la hace</a>
          <a href="#roadmap" className="text-zinc-500 hover:text-zinc-200 transition-colors">Roadmap</a>
          <a href="#faq" className="text-zinc-500 hover:text-zinc-200 transition-colors">Preguntas</a>
          <Link to="/login" className="text-accent hover:text-accent-bright font-semibold transition-colors">
            Iniciar sesión
          </Link>
        </nav>
      </div>

      <div className="border-t border-ink-900">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-zinc-600">
            © {new Date().getFullYear()} Forge · Hecho por Frank Alessandro Roldán
          </p>
          <p className="text-[11px] text-zinc-600 font-display uppercase tracking-[0.15em]">
            Forja tu progreso · kg y cm
          </p>
        </div>
      </div>
    </footer>
  )
}
