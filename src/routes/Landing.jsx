import { lazy, Suspense, useLayoutEffect, useRef } from 'react'
import {
  gsap,
  ScrollTrigger,
  createSectionContext,
  rescueHiddenContent,
} from '../components/features/landing/gsapSetup'
import LandingNav from '../components/features/landing/LandingNav'
import LandingHero from '../components/features/landing/LandingHero'
import LandingMarquee from '../components/features/landing/LandingMarquee'
import LandingFooter from '../components/features/landing/LandingFooter'
import '../components/features/landing/landing.css'

// Todo lo que no entra en la primera pantalla viaja en su propio chunk: la
// primera pintura sólo necesita el nav, el hero y el marquee.
const LandingBelow = lazy(() => import('../components/features/landing/LandingBelow'))

export default function Landing() {
  const root = useRef(null)

  useLayoutEffect(() => {
    // La landing es la única pantalla con scroll suave nativo (para las anclas
    // del nav). Se restaura al salir para no afectar al resto de la app.
    const html = document.documentElement
    const prevScrollBehavior = html.style.scrollBehavior
    html.style.scrollBehavior = 'smooth'
    window.scrollTo(0, 0)

    const cleanup = createSectionContext(root, () => {
      // Barra de progreso de lectura, atada al scroll de toda la página.
      // `end: () => maxScroll` en vez de `trigger: body, end: 'bottom bottom'`:
      // con los pines de Showcase/Features, el borde inferior del <body> no
      // siempre coincide con el scroll máximo real, y la barra llegaba al 100%
      // antes de tocar fondo. `refreshPriority` bajo la deja para el final de
      // cada refresh, cuando los demás pines ya terminaron de acomodar su alto.
      gsap.to('[data-progress]', {
        scaleX: 1,
        ease: 'none',
        transformOrigin: 'left center',
        scrollTrigger: {
          start: 0,
          end: () => ScrollTrigger.maxScroll(window),
          scrub: 0.3,
          refreshPriority: -100,
        },
      })
    })

    // Las secciones con pin dependen de medidas que cambian cuando terminan de
    // cargar fuentes e imágenes: un refresh tardío evita triggers desfasados.
    // Después del refresh, el rescate destapa lo que haya quedado oculto.
    const refresh = () => {
      ScrollTrigger.refresh()
      if (root.current) rescueHiddenContent(root.current)
    }
    const timers = [setTimeout(refresh, 400), setTimeout(refresh, 1500)]
    document.fonts?.ready.then(refresh)

    // Antes esto corría cada vez que el scroll se detenía. Ahora sólo mientras
    // los pines todavía se pueden estar acomodando: pasados los primeros
    // segundos, un trigger que no disparó ya no va a disparar por scrollear.
    let idle
    const onScroll = () => {
      clearTimeout(idle)
      idle = setTimeout(() => root.current && rescueHiddenContent(root.current), 250)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    const stopWatching = setTimeout(() => window.removeEventListener('scroll', onScroll), 8000)

    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(idle)
      clearTimeout(stopWatching)
      window.removeEventListener('scroll', onScroll)
      html.style.scrollBehavior = prevScrollBehavior
      cleanup()
    }
  }, [])

  return (
    // Sin `overflow` en el contenedor: cualquier recorte aquí rompería el
    // `position: sticky` del showcase. El desborde lateral lo maneja el <html>.
    <div ref={root} className="relative bg-ink-950 text-zinc-100">
      <div
        data-progress
        aria-hidden
        className="fixed top-0 left-0 right-0 h-[3px] bg-accent z-[60] scale-x-0 origin-left"
      />

      <LandingNav />

      <main className="relative z-10">
        <LandingHero />
        <LandingMarquee />
        {/* El fallback reserva una pantalla completa: el footer no alcanza a
            asomarse bajo el marquee mientras llega el chunk. */}
        <Suspense fallback={<div className="min-h-screen" />}>
          <LandingBelow />
        </Suspense>
      </main>

      <LandingFooter />
    </div>
  )
}
