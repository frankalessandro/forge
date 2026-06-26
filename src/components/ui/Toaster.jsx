import { useEffect } from 'react'
import { Star } from 'lucide-react'
import { useToastStore } from '../../stores/toastStore'

const TOAST_MS = 5000

function ToastItem({ toast, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, TOAST_MS)
    return () => clearTimeout(t)
  }, [onClose])

  // toast.icon ya es un componente lucide (resuelto por quien crea el toast).
  const Icon = toast.icon ?? Star

  return (
    <button
      onClick={onClose}
      className="w-full text-left flex items-center gap-3 bg-ink-900 border border-accent/30 rounded-2xl px-4 py-3 shadow-lg shadow-black/40"
    >
      <div className="rounded-xl bg-accent/15 text-accent p-2 shrink-0">
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="display text-sm text-zinc-100 truncate">{toast.title}</p>
        {toast.description && <p className="text-xs text-zinc-400 truncate">{toast.description}</p>}
      </div>
    </button>
  )
}

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const removeToast = useToastStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 inset-x-0 z-[60] px-4 pointer-events-none">
      <div className="max-w-sm mx-auto space-y-2 pointer-events-auto">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </div>
  )
}
