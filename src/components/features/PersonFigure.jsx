/**
 * Silueta simple de una persona (el "NPC" de los pickers de medidas).
 * Hereda el color vía `currentColor`; se escala con `style` desde afuera.
 */
export default function PersonFigure({ className = '', style }) {
  return (
    <svg viewBox="0 0 60 150" className={className} style={style} aria-hidden="true">
      <g fill="currentColor">
        {/* cabeza */}
        <circle cx="30" cy="14" r="13" />
        {/* torso */}
        <rect x="16" y="30" width="28" height="56" rx="13" />
        {/* brazos */}
        <rect x="7" y="34" width="7" height="44" rx="3.5" />
        <rect x="46" y="34" width="7" height="44" rx="3.5" />
        {/* piernas */}
        <rect x="19" y="86" width="9.5" height="63" rx="4.75" />
        <rect x="31.5" y="86" width="9.5" height="63" rx="4.75" />
      </g>
    </svg>
  )
}
