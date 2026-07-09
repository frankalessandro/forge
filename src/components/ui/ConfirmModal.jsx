import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function ConfirmModal({
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-sm bg-ink-900 border border-ink-700 rounded-2xl p-6 shadow-2xl shadow-black/60 animate-in">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          <X size={18} />
        </button>

        <h2 className="font-display font-bold uppercase tracking-tight text-lg text-zinc-100 pr-6 leading-tight">
          {title}
        </h2>

        {description && (
          <p className="text-sm text-zinc-500 mt-2">{description}</p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="btn-dark flex-1 py-3 text-sm"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 text-sm rounded-xl font-display font-bold uppercase tracking-wider transition-all active:scale-[0.98] ${
              danger
                ? 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25'
                : 'btn-accent'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
