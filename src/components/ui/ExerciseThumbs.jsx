import { Dumbbell } from 'lucide-react'

// Miniaturas circulares solapadas de los primeros ejercicios de una sesión,
// con un contador "+N" para el resto. Compartido por Progreso (History) y el
// historial de amigos (FriendWorkouts).
export default function ExerciseThumbs({ thumbs, extra = 0 }) {
  if (!thumbs?.length) return null
  return (
    <div className="flex items-center">
      {thumbs.map((t, i) => (
        <div
          key={t.id}
          className="w-8 h-8 rounded-full bg-ink-800 ring-2 ring-ink-900 overflow-hidden shrink-0 flex items-center justify-center"
          style={{ marginLeft: i === 0 ? 0 : -10, zIndex: thumbs.length - i }}
          title={t.name}
        >
          {t.imageUrl ? (
            <img src={t.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <Dumbbell size={13} className="text-zinc-600" />
          )}
        </div>
      ))}
      {extra > 0 && (
        <div
          className="w-8 h-8 rounded-full bg-ink-800 ring-2 ring-ink-900 flex items-center justify-center shrink-0 text-[10px] font-display font-semibold text-zinc-400"
          style={{ marginLeft: -10 }}
        >
          +{extra}
        </div>
      )}
    </div>
  )
}
