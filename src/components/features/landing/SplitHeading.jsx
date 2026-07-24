/**
 * Título partido en palabras (`[data-word]`), listo para animar con un
 * stagger de GSAP.
 *
 * Se parte por palabra y no por letra a propósito:
 *
 * 1. Peso. Un `<span>` por letra convierte un título en 20-30 nodos
 *    animados; entre todas las secciones eran cientos de capas de GPU
 *    vivas al mismo tiempo. Por palabra son 3 o 4.
 * 2. Acentos. La versión por letra envolvía cada palabra en una máscara
 *    con `overflow: hidden`, y en mayúsculas la tilde de la Á o la ~ de
 *    la Ñ viven por encima de la altura de caja: quedaban recortadas
 *    (MAÑANA, ASÍ, ESTÁ). Sin máscara, no hay nada que recortar.
 *
 * Se parte en React y no con el plugin SplitText porque las fuentes
 * cargan async: un split hecho sobre el DOM ya renderizado se rompería
 * al llegar Oswald.
 */
export default function SplitHeading({ text, as: Tag = 'h1', className = '' }) {
  return (
    <Tag className={`split ${className}`}>
      {text.split('\n').map((line, li) => (
        <span key={li} className="split-line block">
          {line.split(' ').map((word, wi) => (
            <span key={wi} data-word className="split-word">
              {word}
            </span>
          ))}
        </span>
      ))}
    </Tag>
  )
}
