import { Link } from 'react-router-dom'

/**
 * Bloque de estadística "bold deportivo": número grande + label en mayúsculas.
 * variant: 'default' | 'accent'
 * to: si se pasa, el bloque se renderiza como Link (navegable).
 */
export default function Stat({ value, label, suffix, variant = 'default', className = '', to }) {
  const accent = variant === 'accent'
  const Wrapper = to ? Link : 'div'
  return (
    <Wrapper
      {...(to ? { to } : {})}
      className={`relative overflow-hidden rounded-2xl border p-4 ${
        accent
          ? 'bg-accent/10 border-accent/25'
          : 'bg-ink-900 border-ink-800'
      } ${to ? 'card-hover' : ''} ${className}`}
    >
      <p className={`stat-num text-3xl ${accent ? 'text-accent' : 'text-zinc-100'}`}>
        {value}
        {suffix && <span className="text-base font-semibold text-zinc-500 ml-1">{suffix}</span>}
      </p>
      <p className="eyebrow mt-1">{label}</p>
    </Wrapper>
  )
}
