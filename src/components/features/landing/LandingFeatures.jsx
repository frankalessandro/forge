import { useLayoutEffect, useRef } from 'react'
import {
  Timer,
  Dumbbell,
  ClipboardList,
  CalendarDays,
  TrendingUp,
  Flame,
  Trophy,
  Users,
  Target,
} from 'lucide-react'
import { gsap, ScrollTrigger, createSectionContext, revealWords, revealBatch } from './gsapSetup'
import SplitHeading from './SplitHeading'
import FeaturePreview from './FeaturePreview'

const FEATURES = [
  {
    preview: 'workout',
    icon: Timer,
    title: 'Entrenamiento en vivo',
    text: 'Peso y repeticiones por serie, cronómetro corriendo y descanso automático. Si cierras la app, la sesión te espera donde la dejaste.',
  },
  {
    preview: 'catalog',
    icon: Dumbbell,
    title: '1.359 ejercicios',
    text: 'Cada uno con imagen, músculo principal y secundarios. Buscas, filtras por grupo muscular y lo agregas a la sesión en dos toques.',
  },
  {
    preview: 'routine',
    icon: ClipboardList,
    title: 'Rutinas a tu medida',
    text: 'Arma tu rutina ejercicio por ejercicio con series y repeticiones objetivo. ¿Sin ideas? Genera una según tu objetivo y edítala.',
  },
  {
    preview: 'calendar',
    icon: CalendarDays,
    title: 'Calendario semanal',
    text: 'Asignas qué toca cada día y el inicio te lo recuerda. Los días de descanso también cuentan: aquí están planificados.',
  },
  {
    preview: 'progress',
    icon: TrendingUp,
    title: 'Progreso medible',
    text: 'Gráficas de evolución por ejercicio y volumen semanal en toneladas. La diferencia entre creer que mejoras y comprobarlo.',
  },
  {
    preview: 'records',
    icon: Target,
    title: 'Récords personales',
    text: 'Cada vez que superas tu marca queda registrado con la fecha y cuánto subiste. Tu historial de fuerza, ordenado solo.',
  },
  {
    preview: 'streak',
    icon: Flame,
    title: 'Rachas semanales',
    text: 'La racha cuenta semanas, no días: entrenaste esta semana, la racha sigue. Premia constancia real, no obsesión diaria.',
  },
  {
    preview: 'achievements',
    icon: Trophy,
    title: 'Logros y rangos',
    text: '51 logros repartidos entre racha, volumen, fuerza y constancia. Cada uno suma experiencia y te acerca al siguiente rango.',
  },
  {
    preview: 'friends',
    icon: Users,
    title: 'Amigos',
    text: 'Los agregas por su usuario, ves sus entrenamientos y comparas progreso. Tú decides qué sesiones son públicas.',
  },
]

function FeatureCard({ feature, index }) {
  const Icon = feature.icon
  return (
    <article
      data-card
      className="group relative shrink-0 w-[82vw] sm:w-[400px] lg:w-[360px] card p-5 sm:p-6 hover:border-ink-600 transition-colors"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-accent/12 text-accent flex items-center justify-center group-hover:bg-accent group-hover:text-ink-950 transition-colors">
          <Icon size={19} />
        </div>
        <span className="font-display font-bold text-2xl text-ink-800 leading-none">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      <FeaturePreview name={feature.preview} />

      <h3 className="font-display font-bold uppercase tracking-tight text-lg text-zinc-100 mt-5">
        {feature.title}
      </h3>
      <p className="text-sm text-zinc-400 leading-relaxed mt-2">{feature.text}</p>
    </article>
  )
}

export default function LandingFeatures() {
  const root = useRef(null)
  const pinWrap = useRef(null)
  const track = useRef(null)

  useLayoutEffect(() =>
    createSectionContext(root, () => {
      const q = gsap.utils.selector(root)
      revealWords(root.current)

      const mm = gsap.matchMedia()

      // Desktop: el bloque se queda fijo y las tarjetas se desplazan en
      // horizontal con el scroll. El título viaja pineado junto a ellas.
      mm.add('(min-width: 1024px)', () => {
        // El riel incluye su propio padding lateral, así que `scrollWidth`
        // ya contempla el margen inicial: la última tarjeta llega completa.
        const distance = () => Math.max(0, track.current.scrollWidth - window.innerWidth)
        // El scroll vertical dura más que el recorrido horizontal (×1.6): las
        // tarjetas pasan más despacio y da tiempo a leer cada una.
        const scrollLength = () => distance() * 1.6

        // Un solo ScrollTrigger para el riel *y* la barra de avance: antes
        // eran dos midiendo exactamente el mismo recorrido, o sea el doble de
        // trabajo en cada frame de scroll y en cada refresh.
        const bar = q('[data-h-progress]')[0]
        const tween = gsap.timeline({
          scrollTrigger: {
            trigger: pinWrap.current,
            start: 'top top',
            end: () => `+=${scrollLength()}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        })
          .to(track.current, { x: () => -distance(), ease: 'none' }, 0)
          .to(bar, { scaleX: 1, ease: 'none' }, 0)

        return () => tween.kill()
      })

      // Móvil / tablet: sin pin. Las tarjetas aparecen al entrar en pantalla,
      // agrupadas en un solo batch en vez de un trigger por tarjeta.
      mm.add('(max-width: 1023px)', () => {
        revealBatch(q('[data-card]'), { y: 44, start: 'top 88%' })
      })

      // El ancho del riel depende de fuentes que cargan async.
      document.fonts?.ready.then(() => ScrollTrigger.refresh())

      return () => mm.revert()
    })
  , [])

  return (
    <section id="features" ref={root} className="relative">
      <div
        ref={pinWrap}
        className="lg:h-screen flex flex-col justify-center py-24 lg:py-0 overflow-hidden"
      >
        <div className="landing-wrap shrink-0">
          <p className="section-title">Qué trae Forge</p>
          <SplitHeading
            text="Todo lo que necesitas"
            as="h2"
            className="font-display font-bold uppercase tracking-tighter leading-[0.94] text-[clamp(2rem,5vw,3.8rem)] text-zinc-100 mt-4"
          />
          <p className="text-zinc-500 mt-4 max-w-lg text-sm leading-relaxed">
            Nueve módulos, cero relleno. Cada pantalla existe porque hacía falta al entrenar.
          </p>
        </div>

        {/* Riel horizontal (desktop) / columna (móvil) */}
        <div className="mt-9 lg:mt-10">
          <div
            ref={track}
            // `will-change` sólo en desktop: es donde el riel realmente se
            // desplaza. En móvil es una columna quieta y reservar una capa de
            // GPU para nueve tarjetas era memoria tirada.
            className="flex flex-col lg:flex-row gap-5 lg:gap-6 px-5 sm:px-8 lg:w-max lg:px-[max(2rem,calc((100vw-72rem)/2))] lg:will-change-transform"
          >
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} feature={f} index={i} />
            ))}
          </div>
        </div>

        {/* Indicador de avance del riel (solo desktop) */}
        <div className="hidden lg:block max-w-6xl w-full mx-auto px-8 mt-8 shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-0.5 flex-1 bg-ink-800 overflow-hidden rounded-full">
              <div data-h-progress className="h-full w-full bg-accent origin-left scale-x-0" />
            </div>
            <span className="eyebrow shrink-0">Sigue bajando</span>
          </div>
        </div>
      </div>
    </section>
  )
}
