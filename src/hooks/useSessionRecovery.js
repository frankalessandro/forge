import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useWorkoutStore } from '../stores/workoutStore'
import { logError } from '../utils/logError'

// El estado del entreno activo vive en localStorage (por dispositivo), pero la
// sesión se crea en la DB al empezar. Si el usuario limpia el storage, cambia
// de dispositivo o abandona, quedan sesiones abiertas (finished_at null) que
// nadie retoma ni limpia. Este hook reconcilia al abrir la app:
//   - Sin entreno local activo y con una sesión abierta reciente → se readopta
//     (se reconstruye el store desde los sets) y reaparece el banner "en curso".
//   - Sesiones abiertas viejas (zombis): si tienen series completadas se
//     cierran con la hora de la última serie; si están vacías se borran.
// Las sesiones abiertas recientes que no son la local NO se tocan: podrían
// estar corriendo en otro dispositivo.
const STALE_MS = 12 * 60 * 60 * 1000

export function useSessionRecovery() {
  const ready = useAuthStore((s) => s.ready)
  const userId = useAuthStore((s) => s.user?.id)
  const hasHydrated = useWorkoutStore((s) => s.hasHydrated)
  const ran = useRef(false)

  useEffect(() => {
    if (!ready || !userId || !hasHydrated || ran.current) return
    ran.current = true

    async function reconcile() {
      const { session: localSession, isActive } = useWorkoutStore.getState()
      const { data: open } = await supabase
        .from('workout_sessions')
        .select('id, started_at, notes')
        .eq('user_id', userId)
        .is('finished_at', null)
        .order('started_at', { ascending: false })
      if (!open?.length) return

      const now = Date.now()
      const currentId = isActive ? localSession?.id : null
      const candidates = open.filter((s) => s.id !== currentId)
      const isStale = (s) => now - new Date(s.started_at).getTime() >= STALE_MS

      let toAdopt = null
      if (!isActive && candidates.length > 0 && !isStale(candidates[0])) {
        toAdopt = candidates[0]
      }

      const zombies = candidates.filter((s) => s !== toAdopt && isStale(s))

      if (toAdopt) {
        const { data: sets } = await supabase
          .from('workout_sets')
          .select('id, exercise_id, set_number, reps, weight_kg, set_type, completed_at, exercises(name, image_url, equipment)')
          .eq('session_id', toAdopt.id)
          .order('created_at')

        // Agrupar por ejercicio en orden de primera aparición; sets por número.
        const byExercise = new Map()
        for (const s of sets ?? []) {
          let ex = byExercise.get(s.exercise_id)
          if (!ex) {
            ex = {
              exerciseId: s.exercise_id,
              name: s.exercises?.name ?? 'Ejercicio',
              imageUrl: s.exercises?.image_url ?? null,
              equipment: s.exercises?.equipment ?? null,
              restSeconds: null,
              sets: [],
            }
            byExercise.set(s.exercise_id, ex)
          }
          ex.sets.push({
            dbId: s.id,
            reps: s.reps,
            weight_kg: s.weight_kg,
            set_type: s.set_type ?? 'normal',
            completed: Boolean(s.completed_at),
            _n: s.set_number ?? 0,
          })
        }
        const exercises = [...byExercise.values()].map((ex) => ({
          ...ex,
          sets: ex.sets.sort((a, b) => a._n - b._n).map(({ _n, ...rest }) => rest), // eslint-disable-line no-unused-vars
        }))
        useWorkoutStore.getState().restoreSession(
          { id: toAdopt.id, startedAt: toAdopt.started_at, notes: toAdopt.notes ?? '' },
          exercises,
        )
      }

      if (zombies.length > 0) {
        const ids = zombies.map((s) => s.id)
        const { data: doneSets } = await supabase
          .from('workout_sets')
          .select('session_id, completed_at')
          .in('session_id', ids)
          .not('completed_at', 'is', null)

        const lastDone = new Map()
        for (const s of doneSets ?? []) {
          const t = new Date(s.completed_at).getTime()
          if (!lastDone.has(s.session_id) || t > lastDone.get(s.session_id)) {
            lastDone.set(s.session_id, t)
          }
        }

        const toClose = zombies.filter((s) => lastDone.has(s.id))
        const toDelete = zombies.filter((s) => !lastDone.has(s.id)).map((s) => s.id)

        await Promise.all([
          ...toClose.map((s) =>
            supabase
              .from('workout_sessions')
              .update({ finished_at: new Date(lastDone.get(s.id)).toISOString() })
              .eq('id', s.id)
          ),
          ...(toDelete.length
            ? [supabase.from('workout_sessions').delete().in('id', toDelete)]
            : []),
        ])
      }
    }

    reconcile().catch((err) => logError('useSessionRecovery.reconcile', err))
  }, [ready, userId, hasHydrated])
}
