import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronRight, Dumbbell, Plus, Pencil, Trash2, Sparkles } from 'lucide-react'
import { useRoutines } from '../../hooks/useRoutines'
import { useProfile } from '../../hooks/useProfile'
import { levelFromActivity, splitLabel, GOAL_LABELS } from '../../utils/routineTemplates'
import PageHeader from '../../components/ui/PageHeader'

const CATEGORY_COLORS = {
  PPL: 'bg-sky-400/15 text-sky-300',
  'Full Body': 'bg-accent/15 text-accent',
  'Upper Lower': 'bg-fuchsia-400/15 text-fuchsia-300',
}

function CategoryBadge({ category }) {
  if (!category) return null
  const cls = CATEGORY_COLORS[category] ?? 'bg-ink-800 text-zinc-400'
  return <span className={`chip ${cls}`}>{category}</span>
}

function RoutineCard({ routine, onOpen }) {
  return (
    <button onClick={onOpen} className="w-full card card-hover flex items-center gap-4 px-5 py-4 text-left">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="display text-sm text-zinc-100 truncate">{routine.name}</p>
          <CategoryBadge category={routine.category} />
        </div>
        {routine.description && <p className="text-sm text-zinc-500 truncate">{routine.description}</p>}
        <p className="eyebrow mt-1.5">{routine.exerciseCount} ejercicios</p>
      </div>
      <ChevronRight size={18} className="text-zinc-600 shrink-0" />
    </button>
  )
}

function UserRoutineCard({ routine, onOpen, onEdit, onDelete }) {
  return (
    <div className="card flex items-center gap-2 px-5 py-4">
      <button onClick={onOpen} className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2 mb-1">
          <p className="display text-sm text-zinc-100 truncate">{routine.name}</p>
          <CategoryBadge category={routine.category} />
        </div>
        {routine.description && <p className="text-sm text-zinc-500 truncate">{routine.description}</p>}
        <p className="eyebrow mt-1.5">{routine.exerciseCount} ejercicios</p>
      </button>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onEdit} className="p-2 text-zinc-500 hover:text-accent transition-colors" title="Editar">
          <Pencil size={16} />
        </button>
        <button onClick={onDelete} className="p-2 text-zinc-500 hover:text-red-400 transition-colors" title="Eliminar">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return <div className="h-[72px] card animate-pulse" />
}

export default function Routines() {
  const navigate = useNavigate()
  const { getPublicRoutines, getUserRoutines, deleteRoutine, generateForGoal } = useRoutines()
  const { getProfile } = useProfile()
  const [publicRoutines, setPublicRoutines] = useState([])
  const [userRoutines, setUserRoutines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [genMsg, setGenMsg] = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [pub, user, { data: prof }] = await Promise.all([
          getPublicRoutines(),
          getUserRoutines(),
          getProfile(),
        ])
        setPublicRoutines(pub)
        setUserRoutines(user)
        setProfile(prof)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [getPublicRoutines, getUserRoutines, getProfile])

  const handleGenerate = async () => {
    setGenMsg(null)
    setGenerating(true)
    try {
      const { data: profile } = await getProfile()
      if (!profile?.goal) {
        setGenMsg({ type: 'error', text: 'Primero definí tu objetivo en tu perfil.' })
        return
      }
      const created = await generateForGoal({
        goal: profile.goal,
        level: levelFromActivity(profile.activity_level),
        daysPerWeek: profile.training_days_per_week || 3,
      })
      const fresh = await getUserRoutines()
      setUserRoutines(fresh)
      setGenMsg({
        type: 'success',
        text: `Listo: se generaron ${created.length} ${created.length === 1 ? 'rutina' : 'rutinas'} según tu objetivo.`,
      })
    } catch (err) {
      setGenMsg({ type: 'error', text: err.message })
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (routine) => {
    if (!window.confirm(`¿Eliminar la rutina "${routine.name}"?`)) return
    try {
      await deleteRoutine(routine.id)
      setUserRoutines((prev) => prev.filter((r) => r.id !== routine.id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-ink-950">
      <PageHeader
        title="Rutinas"
        back="/app/dashboard"
        right={
          <Link to="/app/routines/new" className="btn-accent px-3 py-1.5 text-xs">
            <Plus size={15} />
            Crear
          </Link>
        }
      />

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-8">
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
        )}

        {/* Generación por objetivo */}
        <section className="card p-5">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-accent/15 text-accent p-3 shrink-0">
              <Sparkles size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="display text-sm text-zinc-100">Generá tu rutina</h2>
              {profile?.goal ? (
                <p className="text-sm text-zinc-500 mt-0.5">
                  Según tu objetivo (<span className="text-accent">{GOAL_LABELS[profile.goal]}</span>) y{' '}
                  {profile.training_days_per_week || 3} días/semana ·{' '}
                  {splitLabel(profile.training_days_per_week || 3)}.
                </p>
              ) : (
                <p className="text-sm text-zinc-500 mt-0.5">
                  Definí tu objetivo en{' '}
                  <Link to="/app/profile" className="text-accent hover:text-accent-bright">tu perfil</Link>{' '}
                  para generar una rutina a tu medida.
                </p>
              )}
            </div>
          </div>

          {genMsg && (
            <p
              className={`text-sm px-3.5 py-2.5 rounded-xl border mt-4 ${
                genMsg.type === 'success'
                  ? 'text-accent bg-accent/10 border-accent/25'
                  : 'text-red-400 bg-red-500/10 border-red-500/20'
              }`}
            >
              {genMsg.text}
            </p>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating || !profile?.goal}
            className="btn-accent w-full py-3 text-sm mt-4 disabled:opacity-40"
          >
            <Sparkles size={16} />
            {generating ? 'Generando…' : 'Generar rutina según mi objetivo'}
          </button>
        </section>

        <section>
          <h2 className="section-title mb-3">Predeterminadas</h2>
          <div className="space-y-3">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              : publicRoutines.map((r) => (
                  <RoutineCard key={r.id} routine={r} onOpen={() => navigate(`/app/routines/${r.id}`)} />
                ))}
          </div>
        </section>

        <section>
          <h2 className="section-title mb-3">Mis rutinas</h2>
          {loading ? (
            <SkeletonCard />
          ) : userRoutines.length === 0 ? (
            <Link
              to="/app/routines/new"
              className="block card border-dashed px-6 py-10 text-center card-hover"
            >
              <Dumbbell size={32} className="mx-auto text-zinc-600 mb-3" />
              <p className="display text-sm text-zinc-300">Todavía no tenés rutinas propias</p>
              <p className="text-sm text-accent mt-1">Creá tu primera rutina</p>
            </Link>
          ) : (
            <div className="space-y-3">
              {userRoutines.map((r) => (
                <UserRoutineCard
                  key={r.id}
                  routine={r}
                  onOpen={() => navigate(`/app/routines/${r.id}`)}
                  onEdit={() => navigate(`/app/routines/${r.id}/edit`)}
                  onDelete={() => handleDelete(r)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
