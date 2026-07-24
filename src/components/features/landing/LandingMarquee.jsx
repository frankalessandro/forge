const TOP = ['Rutinas', 'Series y reps', 'Rachas', 'Récords', 'Volumen', 'Logros', 'Amigos']
const BOTTOM = ['Calendario', 'Historial', 'Gráficas', 'Rangos', '1.359 ejercicios', 'Descansos']

/**
 * Banda infinita, 100% CSS.
 *
 * Antes cada fila era un tween infinito de GSAP más un ScrollTrigger global
 * que leía la velocidad del scroll para inclinar el texto: dos animaciones
 * eternas en el ticker y trabajo en cada frame de scroll, aunque la banda
 * estuviera fuera de pantalla. Un keyframe de CSS corre en el compositor y el
 * navegador lo pausa solo cuando no se ve.
 */
function Row({ items, back = false, accent = false, rotate }) {
  // `w-[112%] -ml-[6%]`: más ancho que el viewport para que la rotación de la
  // banda no deje huecos triangulares en los bordes.
  return (
    <div
      className={`relative overflow-hidden py-3.5 w-[112%] -ml-[6%] ${
        accent ? 'bg-accent' : 'border-y border-ink-800 bg-ink-900'
      }`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <div
        className="marquee-track"
        data-dir={back ? 'back' : undefined}
        style={{ '--dur': `${items.length * 5}s` }}
      >
        {/* Duplicado exacto: el track viaja -50% y el loop cierra sin salto. */}
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            className={`flex items-center gap-8 px-8 font-display font-bold uppercase tracking-tight text-xl sm:text-3xl whitespace-nowrap ${
              accent ? 'text-ink-950' : 'text-zinc-700'
            }`}
          >
            {item}
            <span className={accent ? 'text-ink-950/40' : 'text-accent/50'}>✳</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export default function LandingMarquee() {
  return (
    <div aria-hidden className="relative py-10 overflow-hidden select-none">
      <Row items={TOP} accent rotate={-2} />
      <div className="h-3" />
      <Row items={BOTTOM} back rotate={1.5} />
    </div>
  )
}
