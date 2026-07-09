import { tagChipStyle } from '../../utils/tagColors'

export default function CategoryBadge({ category, color }) {
  if (!category) return null
  return (
    <span className={`chip ${color ? '' : 'bg-ink-800 text-zinc-400'}`} style={tagChipStyle(color)}>
      {category}
    </span>
  )
}
