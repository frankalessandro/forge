import { useLayoutEffect } from 'react'
import { ScrollTrigger } from './gsapSetup'
import LandingProblem from './LandingProblem'
import LandingStats from './LandingStats'
import LandingShowcase from './LandingShowcase'
import LandingFeatures from './LandingFeatures'
import LandingHow from './LandingHow'
import LandingGamification from './LandingGamification'
import LandingSocial from './LandingSocial'
import LandingDev from './LandingDev'
import LandingRoadmap from './LandingRoadmap'
import LandingFaq from './LandingFaq'
import LandingCta from './LandingCta'

/**
 * Todo lo que vive por debajo de la primera pantalla, agrupado en un módulo
 * aparte para que Vite lo emita como su propio chunk.
 *
 * El visitante ve nav + hero + marquee con el JS mínimo; estas once secciones
 * (con sus nueve previews, los tres mocks del teléfono y el catálogo de íconos
 * que arrastran) se descargan en paralelo mientras lee el hero, no antes de
 * que aparezca.
 */
export default function LandingBelow() {
  // Al montar entra ~toda la altura del documento de golpe: los ScrollTriggers
  // que ya existían (los del hero y el nav) tienen medidas viejas.
  useLayoutEffect(() => {
    ScrollTrigger.refresh()
  }, [])

  return (
    <>
      <LandingProblem />
      <LandingStats />
      <LandingShowcase />
      <LandingFeatures />
      <LandingHow />
      <LandingGamification />
      <LandingSocial />
      <LandingDev />
      <LandingRoadmap />
      <LandingFaq />
      <LandingCta />
    </>
  )
}
