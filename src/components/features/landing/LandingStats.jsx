import { useLayoutEffect, useRef } from 'react'
import { gsap, createSectionContext, countUp } from './gsapSetup'

// Números reales del catálogo en producción (no marketing inflado).
const STATS = [
  { value: 1359, label: 'Ejercicios', hint: 'con imágenes y músculos' },
  { value: 21, label: 'Grupos musculares', hint: 'taxonomía completa' },
  { value: 51, label: 'Logros', hint: 'con XP y rangos' },
  { value: 0, label: 'Anuncios', hint: 'ni ahora ni después' },
]

export default function LandingStats() {
  const root = useRef(null)

  useLayoutEffect(() =>
    createSectionContext(root, () => {
      const q = gsap.utils.selector(root)

      // Las cuatro casillas comparten un trigger (entran juntas de todas
      // formas) y los contadores se cuelgan del mismo, en vez de crear uno
      // por número.
      gsap.set(q('[data-stat]'), { autoAlpha: 0, y: 32 })
      gsap.to(q('[data-stat]'), {
        autoAlpha: 1,
        y: 0,
        stagger: 0.09,
        clearProps: 'transform',
        scrollTrigger: { trigger: root.current, start: 'top 82%', once: true },
      })

      q('[data-count]').forEach((el) => countUp(el, Number(el.dataset.count)))
    })
  , [])

  return (
    <section ref={root} className="landing-wrap relative py-16 sm:py-24">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-ink-800 rounded-3xl overflow-hidden border border-ink-800">
        {STATS.map((s) => (
          <div key={s.label} data-stat className="bg-ink-950 p-6 sm:p-8">
            <p className="stat-num text-4xl sm:text-5xl text-accent">
              <span data-count={s.value}>0</span>
            </p>
            <p className="display text-sm text-zinc-100 mt-3">{s.label}</p>
            <p className="text-xs text-zinc-500 mt-1">{s.hint}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
