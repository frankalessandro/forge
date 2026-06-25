import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Dumbbell } from 'lucide-react'
import { useRoutines } from '../../hooks/useRoutines'

const CATEGORY_COLORS = {
  PPL: 'bg-blue-100 text-blue-700',
  'Full Body': 'bg-green-100 text-green-700',
  'Upper Lower': 'bg-purple-100 text-purple-700',
}

function CategoryBadge({ category }) {
  const cls = CATEGORY_COLORS[category] ?? 'bg-gray-100 text-gray-700'
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{category}</span>
}

function RoutineCard({ routine }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(`/app/routines/${routine.id}`)}
      className="w-full flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-5 py-4 hover:bg-gray-50 transition-colors text-left"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-gray-900 truncate">{routine.name}</p>
          <CategoryBadge category={routine.category} />
        </div>
        {routine.description && <p className="text-sm text-gray-500 truncate">{routine.description}</p>}
        <p className="text-xs text-gray-400 mt-1">{routine.exerciseCount} ejercicios</p>
      </div>
      <ChevronRight size={18} className="text-gray-400 shrink-0" />
    </button>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 animate-pulse">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-4 bg-gray-200 rounded w-40" />
        <div className="h-4 bg-gray-200 rounded w-16" />
      </div>
      <div className="h-3 bg-gray-100 rounded w-56 mb-1" />
      <div className="h-3 bg-gray-100 rounded w-20" />
    </div>
  )
}

export default function Routines() {
  const { getPublicRoutines, getUserRoutines } = useRoutines()
  const [publicRoutines, setPublicRoutines] = useState([])
  const [userRoutines, setUserRoutines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [pub, user] = await Promise.all([getPublicRoutines(), getUserRoutines()])
        setPublicRoutines(pub)
        setUserRoutines(user)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [getPublicRoutines, getUserRoutines])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link to="/app/dashboard" className="text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Rutinas</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
        )}

        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Predeterminadas</h2>
          <div className="space-y-3">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              : publicRoutines.map((r) => <RoutineCard key={r.id} routine={r} />)}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Mis rutinas</h2>
          {loading ? (
            <SkeletonCard />
          ) : userRoutines.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl px-6 py-10 text-center">
              <Dumbbell size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">Todavía no tenés rutinas propias</p>
              <p className="text-sm text-gray-400 mt-1">Próximamente podrás crear las tuyas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userRoutines.map((r) => <RoutineCard key={r.id} routine={r} />)}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
