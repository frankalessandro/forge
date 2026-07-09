const CATEGORY_COLORS = {
  PPL: 'bg-sky-400/15 text-sky-300',
  'Full Body': 'bg-accent/15 text-accent',
  'Upper Lower': 'bg-fuchsia-400/15 text-fuchsia-300',
}

export default function CategoryBadge({ category }) {
  if (!category) return null
  const cls = CATEGORY_COLORS[category] ?? 'bg-ink-800 text-zinc-400'
  return <span className={`chip ${cls}`}>{category}</span>
}
