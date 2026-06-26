import { useParams, useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { SessionDetail } from '../HistoryDetail'

export default function Summary() {
  const { sessionId } = useParams()
  const navigate = useNavigate()

  const hero = (
    <div className="flex items-center gap-3 rounded-2xl bg-accent/10 border border-accent/25 px-5 py-4">
      <div className="bg-accent text-ink-950 rounded-xl p-2 shrink-0">
        <Check size={20} strokeWidth={3} />
      </div>
      <div>
        <p className="font-display font-bold uppercase tracking-tight text-lg text-accent leading-none">
          ¡Entreno completado!
        </p>
        <p className="text-sm text-zinc-400 mt-1">Buen trabajo. Quedó registrado.</p>
      </div>
    </div>
  )

  const cta = (
    <button onClick={() => navigate('/app/dashboard', { replace: true })} className="btn-accent w-full py-3.5 text-sm">
      Volver al inicio
    </button>
  )

  return (
    <SessionDetail title="Resumen" back="/app/dashboard" sessionId={sessionId} hero={hero} cta={cta} />
  )
}
