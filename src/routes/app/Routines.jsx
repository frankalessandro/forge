import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronRight, Dumbbell, Plus, Pencil, Trash2, Sparkles, ChevronDown, LayoutList, BookOpen } from 'lucide-react'
import { sileo } from 'sileo'
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
        <button onClick={onEdit} className="p-2 text-zinc-500 hover:text-accent transition-colors">
          <Pencil size={16} />
        </button>
        <button onClick={onDelete} className="p-2 text-zinc-500 hover:text-red-400 transition-colors">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

function Accordion({ icon: Icon, title, count, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 mb-3 group"
      >
        <Icon size={15} className="text-zinc-500 shrink-0" />
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

function SkeletonCard() {
  return <div className="h-[72px] card animate-pulse" />
}

export default function Routines() {
  const navigate = useNavigate()
  const { getPublicRoutines, getUserRoutines, getGeneratedRoutines, deleteRoutine, generateForGoal } = useRoutines()
  const { getProfile } = useProfile()

  const [publicRoutines, setPublicRoutines] = useState([])
  const [userRoutines, setUserRoutines] = useState([])
  const [generatedRoutines, setGeneratedRoutines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [pub, user, gen, { data: prof }] = await Promise.all([
          getPublicRoutines(),
          getUserRoutines(),
          getGeneratedRoutines(),
          getProfile(),
        ])
        setPublicRoutines(pub)
        setUserRoutines(user)
        setGeneratedRoutines(gen)
        setProfile(prof)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [getPublicRoutines, getUserRoutines, getGeneratedRoutines, getProfile])

  const handleGenerate = () => {
    if (!profile?.goal) {
      sileo.error({ title: 'Primero define tu objetivo en tu perfil.' })
      return
    }

    const promise = generateForGoal({
      goal: profile.goal,
      level: levelFromActivity(profile.activity_level),
      daysPerWeek: profile.training_days_per_week || 3,
    }).then(async (created) => {
      const fresh = await getGeneratedRoutines()
      setGeneratedRoutines(fresh)
      return created
    })

    sileo.promise(promise, {
      loading: {
        title: 'Generando rutinas…',
        description: `${GOAL_LABELS[profile.goal]} · ${splitLabel(profile.training_days_per_week || 3)}`,
      },
      success: (created) => ({
        title: `${created.length} rutinas listas`,
        description: 'Reemplazaron las anteriores generadas.',
      }),
      error: (err) => ({
        title: 'Error al generar',
        description: err.message,
      }),
    })
  }

  const handleDelete = async (routine) => {
    if (!window.confirm(`¿Eliminar la rutina "${routine.name}"?`)) return
    try {
      await deleteRoutine(routine.id)
      setUserRoutines((prev) => prev.filter((r) => r.id !== routine.id))
    } catch (err) {
      sileo.error({ title: 'Error al eliminar', description: err.message })
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
          <div className="flex items-start gap-4 mb-4">
            <div className="rounded-xl bg-accent/15 text-accent p-3 shrink-0">
              <Sparkles size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="display text-sm text-zinc-100">Genera tu rutina</h2>
              {profile?.goal ? (
                <p className="text-sm text-zinc-500 mt-0.5">
                  <span className="text-accent">{GOAL_LABELS[profile.goal]}</span>
                  {' · '}{profile.training_days_per_week || 3} días/semana
                  {' · '}{splitLabel(profile.training_days_per_week || 3)}
                </p>
              ) : (
                <p className="text-sm text-zinc-500 mt-0.5">
                  Define tu objetivo en{' '}
                  <Link to="/app/profile" className="text-accent hover:text-accent-bright">tu perfil</Link>{' '}
                  para generar una rutina a tu medida.
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={!profile?.goal}
            className="btn-accent w-full py-3 text-sm disabled:opacity-40"
          >
            <Sparkles size={16} />
            {generatedRoutines.length > 0 ? 'Regenerar según mi objetivo' : 'Generar según mi objetivo'}
          </button>
          {generatedRoutines.length > 0 && (
            <p className="text-xs text-zinc-600 text-center mt-2">
              Esto reemplazará las {generatedRoutines.length} rutinas generadas anteriores
            </p>
          )}
        </section>

        {/* Sección: Según tu objetivo */}
        <Accordion
          icon={Sparkles}
          title="Según tu objetivo"
          count={loading ? undefined : generatedRoutines.length}
          defaultOpen={generatedRoutines.length > 0}
        >
          {loading ? (
            <SkeletonCard />
          ) : generatedRoutines.length === 0 ? (
            <div className="card border-dashed px-6 py-8 text-center">
              <Sparkles size={28} className="mx-auto text-zinc-700 mb-2" />
              <p className="text-sm text-zinc-500">Todavía no generaste ninguna rutina</p>
              <p className="text-xs text-zinc-600 mt-1">Usá el botón de arriba para crear una a tu medida</p>
            </div>
          ) : (
            generatedRoutines.map((r) => (
              <UserRoutineCard
                key={r.id}
                routine={r}
                onOpen={() => navigate(`/app/routines/${r.id}`)}
                onEdit={() => navigate(`/app/routines/${r.id}/edit`)}
                onDelete={() => handleDelete(r)}
              />
            ))
          )}
        </Accordion>

        {/* Sección: Predeterminadas */}
        <Accordion
          icon={BookOpen}
          title="Predeterminadas"
          count={loading ? undefined : publicRoutines.length}
          defaultOpen={false}
        >
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            : publicRoutines.map((r) => (
                <RoutineCard key={r.id} routine={r} onOpen={() => navigate(`/app/routines/${r.id}`)} />
              ))}
        </Accordion>

        {/* Sección: Mis rutinas */}
        <Accordion
          icon={LayoutList}
          title="Mis rutinas"
          count={loading ? undefined : userRoutines.length}
          defaultOpen
        >
          {loading ? (
            <SkeletonCard />
          ) : userRoutines.length === 0 ? (
            <Link
              to="/app/routines/new"
              className="block card border-dashed px-6 py-8 text-center card-hover"
            >
              <Dumbbell size={28} className="mx-auto text-zinc-700 mb-2" />
              <p className="text-sm text-zinc-400">Todavía no tenés rutinas propias</p>
              <p className="text-sm text-accent mt-1">Crear mi primera rutina</p>
            </Link>
          ) : (
            userRoutines.map((r) => (
              <UserRoutineCard
                key={r.id}
                routine={r}
                onOpen={() => navigate(`/app/routines/${r.id}`)}
                onEdit={() => navigate(`/app/routines/${r.id}/edit`)}
                onDelete={() => handleDelete(r)}
              />
            ))
          )}
        </Accordion>
      </main>
    </div>
  )
}
