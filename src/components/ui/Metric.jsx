export default function Metric({ value, label }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="stat-num text-base text-zinc-100">{value}</span>
      <span className="eyebrow">{label}</span>
    </div>
  )
}
