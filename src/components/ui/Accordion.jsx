import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function Accordion({ icon: Icon, title, count, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 mb-3 group"
      >
        {Icon && <Icon size={15} className="text-zinc-500 shrink-0" />}
        <h2 className="section-title flex-1 text-left">{title}</h2>
        {count !== undefined && (
          <span className="chip bg-ink-800 text-zinc-500 text-xs">{count}</span>
        )}
        <ChevronDown
          size={16}
          className={`text-zinc-500 transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
        />
      </button>
      {open && <div className="space-y-3">{children}</div>}
    </section>
  )
}
