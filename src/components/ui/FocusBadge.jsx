import { focusLabel, focusChipClass } from '../../utils/routineFocus'

export default function FocusBadge({ focus }) {
  const label = focusLabel(focus)
  if (!label) return null
  return <span className={`chip ${focusChipClass(focus)}`}>{label}</span>
}
