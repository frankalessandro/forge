import { tagChipClass } from '../../utils/tagColors'

export default function CategoryBadge({ category, color }) {
  if (!category) return null
  return <span className={`chip ${tagChipClass(color)}`}>{category}</span>
}
