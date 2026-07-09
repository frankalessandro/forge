import { useEffect, useState } from 'react'
import { HelpCircle, X, ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useTutorialStore } from '../../stores/tutorialStore'
import { TUTORIALS } from '../../utils/tutorials'

const SPOT_PADDING = 6 // aire alrededor del elemento señalado

/**
 * Tutorial paso a paso de un módulo. Se abre solo la primera vez que el
 * usuario entra al módulo y deja un botón flotante de ayuda para reverlo.
 *
 * Si un paso define `target` (selector CSS), el elemento real de la UI se
 * señala con un spotlight: todo se oscurece menos él, y la tarjeta se coloca
 * al lado. Sin `target` (o si el elemento no está en pantalla) la tarjeta
 * se centra como modal.
 *
 * Uso: <TutorialGuide module="dashboard" />
 * `buttonClassName` posiciona el botón flotante (por defecto, sobre la tab bar).
 */
export default function TutorialGuide({ module: moduleKey, buttonClassName = 'bottom-20 right-4' }) {
  const tutorial = TUTORIALS[moduleKey]
  const markSeen = useTutorialStore((s) => s.markSeen)
  const userId = useAuthStore((s) => s.user?.id)
  // El visto es por usuario: mientras la sesión no resuelva (userId null)
  // lo tratamos como visto para no abrir el tutorial de la cuenta equivocada.
  const seen = useTutorialStore((s) => (userId ? Boolean(s.seenByUser[userId]?.[moduleKey]) : true))
  const [manualOpen, setManualOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [spot, setSpot] = useState(null) // rect (viewport) del elemento señalado

  // Primera visita al módulo (no visto por este usuario): se abre solo.
  const open = manualOpen || !seen

  const close = () => {
    if (userId) markSeen(userId, moduleKey)
    setManualOpen(false)
    setStep(0)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Localiza el elemento del paso, lo centra en pantalla y lo mide.
  // Re-mide en scroll/resize para que el spotlight no se desalinee, y
  // reintenta unos segundos por si el elemento aún está cargando (skeletons).
  useEffect(() => {
    if (!open) return
    const selector = tutorial?.steps[step]?.target
    let found = false
    const measure = () => {
      const el = selector ? document.querySelector(selector) : null
      if (el && !found) {
        found = true
        el.scrollIntoView({ block: 'center', behavior: 'instant' })
      }
      setSpot(el ? el.getBoundingClientRect() : null)
    }
    const raf = requestAnimationFrame(measure)
    const retry = setInterval(() => {
      if (found) return clearInterval(retry)
      measure()
    }, 300)
    const stopRetry = setTimeout(() => clearInterval(retry), 4000)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      cancelAnimationFrame(raf)
      clearInterval(retry)
      clearTimeout(stopRetry)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [open, step, tutorial])

  if (!tutorial) return null

  const total = tutorial.steps.length
  const current = tutorial.steps[step]
  const isLast = step === total - 1
  const Icon = current.icon

  // Con spotlight, la tarjeta va debajo del elemento si este queda en la
  // mitad superior de la pantalla, y encima si queda en la inferior.
  const hasSpot = Boolean(spot)
  const placeBelow = hasSpot && spot.top + spot.height / 2 < window.innerHeight / 2
  const cardWrapStyle = hasSpot
    ? placeBelow
      ? { top: spot.bottom + SPOT_PADDING + 14 }
      : { bottom: window.innerHeight - spot.top + SPOT_PADDING + 14 }
    : undefined

  return (
    <>
      {/* Botón para rever el tutorial cuando quiera */}
      <button
        onClick={() => {
          setStep(0)
          setManualOpen(true)
        }}
        className={`fixed z-30 ${buttonClassName} w-9 h-9 rounded-full bg-ink-900/90 border border-ink-700 text-zinc-500 hover:text-accent hover:border-ink-600 backdrop-blur-sm flex items-center justify-center transition-colors`}
        aria-label="Ver tutorial"
      >
        <HelpCircle size={17} />
      </button>

      {open && (
        <div
          className={`fixed inset-0 z-[60] animate-in ${
            hasSpot ? '' : 'bg-black/70 backdrop-blur-sm flex items-center justify-center px-5'
          }`}
          onClick={close}
        >
          {/* Spotlight: el box-shadow gigante oscurece todo menos el elemento */}
          {hasSpot && (
            <div
              className="fixed rounded-2xl ring-2 ring-accent pointer-events-none transition-all duration-200"
              style={{
                top: spot.top - SPOT_PADDING,
                left: spot.left - SPOT_PADDING,
                width: spot.width + SPOT_PADDING * 2,
                height: spot.height + SPOT_PADDING * 2,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.78)',
              }}
            />
          )}

          <div
            className={hasSpot ? 'absolute inset-x-0 flex justify-center px-5' : 'w-full max-w-sm'}
            style={cardWrapStyle}
          >
            <div
              className="w-full max-w-sm card p-6 relative"
              role="dialog"
              aria-label={`Tutorial de ${tutorial.title}`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={close}
                className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-300 transition-colors"
                aria-label="Cerrar tutorial"
              >
                <X size={18} />
              </button>

              <p className="eyebrow mb-4">
                Tutorial · {tutorial.title}
              </p>

              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-2xl bg-accent/15 text-accent p-3 shrink-0">
                  <Icon size={22} />
                </div>
                <h2 className="display text-lg text-zinc-100">{current.title}</h2>
              </div>

              <p className="text-sm text-zinc-400 leading-relaxed min-h-16">{current.text}</p>

              {/* Progreso */}
              <div className="flex items-center gap-1.5 mt-4 mb-4">
                {tutorial.steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    aria-label={`Paso ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === step ? 'w-6 bg-accent' : 'w-1.5 bg-ink-700 hover:bg-ink-600'
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-3">
                {step > 0 && (
                  <button onClick={() => setStep(step - 1)} className="btn-dark px-4 py-2.5 text-sm shrink-0">
                    <ArrowLeft size={15} />
                    Atrás
                  </button>
                )}
                {isLast ? (
                  <button onClick={close} className="btn-accent flex-1 py-2.5 text-sm">
                    <Check size={15} />
                    ¡Entendido!
                  </button>
                ) : (
                  <button onClick={() => setStep(step + 1)} className="btn-accent flex-1 py-2.5 text-sm">
                    Siguiente
                    <ArrowRight size={15} />
                  </button>
                )}
              </div>

              {!isLast && (
                <button
                  onClick={close}
                  className="w-full text-center text-xs text-zinc-600 hover:text-zinc-400 transition-colors mt-3"
                >
                  Saltar tutorial
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
