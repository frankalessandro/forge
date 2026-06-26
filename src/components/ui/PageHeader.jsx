import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

/**
 * Header sticky consistente. `back` puede ser una ruta (string) o true (history -1).
 */
export default function PageHeader({ title, back, right }) {
  const navigate = useNavigate()
  const goBack = () => {
    if (typeof back === 'string') navigate(back)
    else navigate(-1)
  }

  return (
    <header className="sticky top-0 z-20 bg-ink-950/80 backdrop-blur-md border-b border-ink-800">
      <div className="max-w-2xl mx-auto px-5 h-14 flex items-center gap-3">
        {back != null && (
          <button
            onClick={goBack}
            className="text-zinc-500 hover:text-zinc-100 transition-colors -ml-1"
            aria-label="Volver"
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 className="display text-base text-zinc-100 flex-1 truncate">{title}</h1>
        {right}
      </div>
    </header>
  )
}
