import { useLayoutEffect, useRef } from 'react'
import { Play, Timer, LineChart, ArrowDown } from 'lucide-react'
import { gsap, ScrollTrigger, createSectionContext, revealWords, revealBatch } from './gsapSetup'
import SplitHeading from './SplitHeading'
import PhoneMock from './PhoneMock'

const STEPS = [
  {
    key: 'home',
    icon: Play,
    label: 'Tu inicio',
    title: 'Abres la app y ya sabes qué hacer',
    text: 'El inicio te dice qué rutina toca hoy según tu calendario, cómo viene tu semana y arranca el entrenamiento con un solo toque. Sin menús ni configuración previa.',
  },
  {
    key: 'workout',
    icon: Timer,
    label: 'Durante el entreno',
    title: 'Registrar una serie toma dos segundos',
    text: 'Peso, repeticiones y listo. El cronómetro corre solo, el descanso entre series se cuenta automático y la sesión sobrevive aunque cierres la app o se muera la batería.',
  },
  {
    key: 'progress',
    icon: LineChart,
    label: 'Después',
    title: 'Ves si de verdad estás progresando',
    text: 'Gráficas por ejercicio, volumen semanal y tus récords personales. La diferencia entre "creo que estoy mejorando" y saberlo con números.',
  },
]

export default function LandingShowcase() {
  const root = useRef(null)
  const phoneCol = useRef(null)
  const phoneEl = useRef(null)

  useLayoutEffect(() =>
    createSectionContext(root, () => {
      const q = gsap.utils.selector(root)
      revealWords(root.current)

      const mm = gsap.matchMedia()

      // Desktop: el teléfono queda fijo y las pantallas se cruzan según qué
      // bloque de texto esté activo.
      mm.add('(min-width: 1024px)', () => {
        // El teléfono se fija con el `pin` de ScrollTrigger y no con
        // `position: sticky`: el design system pone `overflow-x: hidden` en
        // <html> y <body>, y eso crea un contenedor de scroll que deja `sticky`
        // sin efecto en todos sus descendientes. El pin no depende de eso.
        const col = phoneCol.current
        const phone = phoneEl.current
        const half = () => (window.innerHeight - phone.offsetHeight) / 2

        ScrollTrigger.create({
          trigger: col,
          // Arranca justo cuando el teléfono queda centrado en pantalla…
          start: () => `top ${half()}px`,
          // …y se suelta cuando el final de la columna alcanza su borde inferior.
          end: () => `bottom ${half() + phone.offsetHeight}px`,
          pin: phone,
          pinSpacing: false,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          // Se mide al final, cuando los pines de los bloques de texto ya
          // sumaron su espacio a la columna. Si se midiera antes, su `end`
          // saldría corto y el teléfono se soltaría en el segundo bloque.
          refreshPriority: -1,
        })

        const screens = q('[data-sticky-phone] [data-screen]')
        const steps = q('[data-step]')
        const dots = q('[data-dot]')
        gsap.set(screens, { autoAlpha: 0 })
        gsap.set(screens[0], { autoAlpha: 1 })

        // Un único punto de verdad para "qué paso está activo": cruza las
        // pantallas del teléfono, resalta el bloque de texto y mueve los puntos
        // del badge. Así siempre hay exactamente uno encendido, y sigue
        // encendido hasta que el siguiente toma el relevo.
        const activate = (index) => {
          screens.forEach((s, i) => {
            gsap.to(s, {
              autoAlpha: i === index ? 1 : 0,
              y: i === index ? 0 : 12,
              duration: 0.45,
              ease: 'power2.out',
              overwrite: 'auto',
            })
          })
          steps.forEach((s, i) => s.classList.toggle('step-active', i === index))
          dots.forEach((d, i) => {
            d.classList.toggle('bg-accent', i === index)
            d.classList.toggle('bg-ink-700', i !== index)
          })
        }
        activate(0)

        // Cada bloque de texto se fija junto al teléfono y se mantiene ahí un
        // rato antes de soltarse: el par teléfono + texto queda quieto mientras
        // el scroll avanza, en vez de pasar de largo.
        //
        // Acá sí va `pinSpacing` (el de por defecto): reserva el recorrido de la
        // pausa en el flujo. Con `pinSpacing: false` el bloque saltaría hacia
        // arriba al soltarse, porque su hueco original ya habría subido.
        const hold = () => window.innerHeight * 0.55

        steps.forEach((step, i) => {
          ScrollTrigger.create({
            trigger: step,
            start: () => `top ${(window.innerHeight - step.offsetHeight) / 2}px`,
            end: () => `+=${hold()}`,
            pin: step,
            invalidateOnRefresh: true,
            // Prioridad alta: estos pines cambian la altura de la columna, así
            // que se miden antes que el del teléfono, que depende de ella.
            refreshPriority: 1,
            onEnter: () => activate(i),
            onEnterBack: () => activate(i),
          })
        })
      })

      // Móvil: cada bloque trae su propio teléfono y entra al hacer scroll.
      // `revealBatch` agrupa en un solo tween los que cruzan el borde en el
      // mismo frame, en vez de crear un ScrollTrigger por bloque.
      mm.add('(max-width: 1023px)', () => {
        revealBatch(q('[data-step-mobile]'), { y: 44, start: 'top 88%' })
      })

      return () => mm.revert()
    })
  , [])

  // Ojo: nada de `overflow-hidden` en esta sección. Recorta el contexto de
  // scroll y le complica la vida al pin; el desborde lateral ya lo controla el
  // <html> del design system.
  return (
    <section id="showcase" ref={root} className="landing-section relative">
      <div aria-hidden className="glow top-1/4 right-0 w-[400px] h-[400px]" style={{ '--glow': '10%' }} />

      <div className="landing-wrap relative">
        <p className="section-title">La app por dentro</p>
        {/* `leading-[0.94]`: "ASÍ" lleva tilde y con 0.9 rozaba la línea de arriba. */}
        <SplitHeading
          text="Así se siente usarla"
          as="h2"
          className="font-display font-bold uppercase tracking-tighter leading-[0.94] text-[clamp(2.2rem,6vw,4.5rem)] text-zinc-100 mt-4 max-w-3xl"
        />

        {/* Sin `items-start`: la celda del teléfono debe estirarse a lo alto de
            la fila para que el pin tenga recorrido. */}
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 mt-16">
          {/* La columna se estira a lo alto de la fila del grid (sin
              `items-start`) y marca el recorrido durante el cual el teléfono
              queda fijo. */}
          <div ref={phoneCol} className="hidden lg:block relative">
            <div ref={phoneEl} data-sticky-phone>
              <PhoneMock />

              {/* Badge: en qué paso vas y que todavía hay recorrido. Va dentro
                  del bloque fijado, así acompaña al teléfono todo el trayecto. */}
              <div className="flex items-center justify-center gap-3 mt-7">
                <div className="flex gap-1.5">
                  {STEPS.map((s) => (
                    <span key={s.key} data-dot className="w-1.5 h-1.5 rounded-full bg-ink-700 transition-colors" />
                  ))}
                </div>
                <span className="eyebrow">Sigue bajando</span>
                <ArrowDown className="nudge text-accent" size={14} />
              </div>
            </div>
          </div>

          {/* Bloques de texto */}
          {/* La separación es el respiro *entre* pausas: cada bloque suma
              además su propio `hold` al quedar fijado, así que no hace falta
              tanto hueco como cuando solo pasaban de largo. */}
          <div className="space-y-24 lg:space-y-[35vh] lg:py-[28vh]">
            {STEPS.map((s) => (
              <div key={s.key}>
                {/* Móvil: teléfono + texto juntos */}
                <div data-step-mobile className="lg:hidden mb-8">
                  <PhoneMock screen={s.key} />
                </div>

                <div
                  data-step
                  className="lg:opacity-40 lg:[&.step-active]:opacity-100 transition-opacity duration-500"
                >
                  <div className="inline-flex items-center gap-2 chip-accent">
                    <s.icon size={13} />
                    {s.label}
                  </div>
                  <h3 className="font-display font-bold uppercase tracking-tight text-2xl sm:text-4xl text-zinc-100 mt-4 leading-[1.05]">
                    {s.title}
                  </h3>
                  <p className="text-zinc-400 leading-relaxed mt-4 max-w-md">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
