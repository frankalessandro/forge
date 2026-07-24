import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Registro único de plugins para toda la landing. Cada sección importa `gsap`
// y `ScrollTrigger` desde acá, así el registro ocurre una sola vez por chunk.
gsap.registerPlugin(ScrollTrigger)

// Defaults comunes: la landing entera usa la misma curva y duración base para
// que las secciones se sientan parte del mismo sistema de movimiento.
gsap.defaults({ ease: 'power3.out', duration: 0.9 })

// Menos frames por segundo en las animaciones atadas al scroll. GSAP igual
// interpola suave, pero deja de recalcular a 120 Hz en pantallas rápidas: es
// trabajo que nadie percibe y que en móviles de gama media se nota.
ScrollTrigger.config({ ignoreMobileResize: true, limitCallbacks: true })

export { gsap, ScrollTrigger }

/**
 * Envuelve las animaciones de una sección en un `gsap.context` scopeado al ref.
 * Devuelve la función de limpieza lista para `useLayoutEffect`, y respeta
 * `prefers-reduced-motion`: si el usuario lo pidió, no anima nada (el contenido
 * ya es visible en el HTML, así que simplemente se queda quieto).
 */
export function createSectionContext(scopeRef, build) {
  const ctx = gsap.context((self) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    // Se devuelve lo que retorne `build`: si es una función, GSAP la ejecuta al
    // revertir el contexto. Así una sección puede limpiar su `matchMedia`, que
    // no vive dentro del contexto y si no quedaría duplicada al remontar
    // (React en modo estricto monta, desmonta y vuelve a montar).
    return build(self)
  }, scopeRef)
  return () => ctx.revert()
}

/**
 * ¿El elemento ya está a la vista (o casi) en el momento de montar?
 *
 * Importa porque una sección con `pin` cambia la altura del documento: los
 * ScrollTriggers creados antes del refresh quedan con posiciones viejas y, si
 * no llegan a dispararse, el contenido se queda oculto para siempre. Por eso
 * todo lo que ya está en pantalla se anima de una y no depende del scroll.
 */
function isNearViewport(el, margin = 0.95) {
  const rect = el.getBoundingClientRect()
  return rect.top < window.innerHeight * margin && rect.bottom > 0
}

/**
 * Aparición estándar de la landing: el elemento sube y se desvanece hacia
 * adentro cuando entra en pantalla. El estado inicial se aplica acá (no en CSS)
 * para que sin JS el contenido siga siendo visible.
 *
 * Un solo ScrollTrigger para todo el grupo (disparado por el primer elemento)
 * en lugar de uno por tarjeta: la landing pasó de ~90 triggers a ~25, y cada
 * trigger es trabajo que ScrollTrigger repite en cada `refresh`.
 */
export function revealOnScroll(targets, { y = 40, stagger = 0.08, start = 'top 85%' } = {}) {
  const els = gsap.utils.toArray(targets)
  if (!els.length) return

  gsap.set(els, { autoAlpha: 0, y })
  const vars = { autoAlpha: 1, y: 0, stagger, clearProps: 'transform' }

  if (isNearViewport(els[0])) return gsap.to(els, vars)
  return gsap.to(els, { ...vars, scrollTrigger: { trigger: els[0], start, once: true } })
}

/**
 * Igual que `revealOnScroll`, pero cada elemento entra cuando *él* aparece en
 * pantalla, no cuando aparece el primero del grupo. Para listas largas que no
 * caben juntas en el viewport (tarjetas, pasos).
 *
 * Usa `ScrollTrigger.batch`, que agrupa en un solo tween los elementos que
 * cruzan el borde en el mismo frame: mucho más barato que crear un trigger por
 * elemento, que era el patrón repetido en casi todas las secciones.
 */
export function revealBatch(targets, { y = 40, stagger = 0.08, start = 'top 88%' } = {}) {
  const els = gsap.utils.toArray(targets)
  if (!els.length) return

  gsap.set(els, { autoAlpha: 0, y })
  ScrollTrigger.batch(els, {
    start,
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, { autoAlpha: 1, y: 0, stagger, overwrite: true, clearProps: 'transform' }),
  })
  // Los que ya estaban en pantalla al montar no disparan `onEnter` si el
  // refresh llega tarde: se resuelven de una.
  const visible = els.filter((el) => isNearViewport(el))
  if (visible.length) gsap.to(visible, { autoAlpha: 1, y: 0, stagger, clearProps: 'transform' })
}

/**
 * Entrada palabra por palabra para los títulos hechos con <SplitHeading>.
 * `scope` es el elemento raíz de la sección; `trigger` define cuándo arranca.
 *
 * `clearProps` al terminar devuelve las palabras a un render normal: sin
 * transform propio no hay capa de composición reservada por cada una.
 */
export function revealWords(scope, { trigger, start = 'top 82%', stagger = 0.05 } = {}) {
  const words = scope.querySelectorAll('[data-word]')
  if (!words.length) return

  gsap.set(words, { autoAlpha: 0, y: '0.4em' })
  const vars = {
    autoAlpha: 1,
    y: 0,
    duration: 0.8,
    ease: 'power3.out',
    stagger,
    clearProps: 'transform',
  }

  if (isNearViewport(trigger || scope)) return gsap.to(words, vars)
  return gsap.to(words, { ...vars, scrollTrigger: { trigger: trigger || scope, start, once: true } })
}

/**
 * Red de seguridad: si por cualquier motivo (refresh a destiempo, un pin que
 * movió todo) quedó contenido oculto dentro del viewport, lo muestra. Sin esto,
 * un ScrollTrigger que no dispara deja un título en blanco de forma permanente.
 *
 * Sólo mira elementos marcados con `data-reveal`: antes recorría una lista de
 * 16 selectores sobre todo el documento cada vez que el scroll se detenía.
 */
export function rescueHiddenContent(root) {
  root.querySelectorAll('[data-reveal],[data-word]').forEach((el) => {
    // El hero se anima solo al montar, con su propia coreografía: rescatarlo
    // pisaría el stagger de entrada.
    if (el.closest('[data-no-rescue]')) return
    if (!isNearViewport(el, 1)) return
    if (gsap.getProperty(el, 'opacity') >= 1) return

    gsap.to(el, { y: 0, x: 0, autoAlpha: 1, duration: 0.4, overwrite: 'auto' })
  })
}

/** Anima un contador numérico desde 0 hasta `value` al entrar en viewport. */
export function countUp(el, value, { decimals = 0 } = {}) {
  const obj = { n: 0 }
  return gsap.to(obj, {
    n: value,
    duration: 1.6,
    ease: 'power2.out',
    scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    onUpdate: () => {
      el.textContent = obj.n.toLocaleString('es-419', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    },
  })
}
