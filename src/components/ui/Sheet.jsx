import { useEffect } from 'react'

/**
 * Bottom sheet con backdrop. Se cierra al tocar afuera o con Escape.
 */
export default function Sheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mt-auto bg-ink-900 border-t border-ink-700 rounded-t-3xl pb-[max(1.5rem,env(safe-area-inset-bottom))] animate-[sheet_0.22s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-ink-600" />
        </div>
        {title && (
          <h2 className="display text-center text-sm text-zinc-300 pb-2">{title}</h2>
        )}
        <div className="px-5 pt-1">{children}</div>
      </div>
      <style>{`@keyframes sheet{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </div>
  )
}
