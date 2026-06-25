import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogOut, Dumbbell, Play, History, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'

function getMondayOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1 - day)
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toDateStr(date) {
  return date.toISOString().slice(0, 10)
}

function calcVolume(sets) {
  return sets
    .filter((s) => s.set_type !== 'warmup')
    .reduce((acc, s) => acc + (s.reps ?? 0) * (s.weight_kg ?? 0), 0)
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setStatsLoading(true)
    const now = new Date()
    const monday = getMondayOfWeek(now)

    const { data: weekSessions } = await supabase
      .from('workout_sessions')
      .select('id, started_at, finished_at')
      .not('finished_at', 'is', null)
      .gte('started_at', monday.toISOString())

    let weekVolume = 0
    if (weekSessions && weekSessions.length > 0) {
      const ids = weekSessions.map((s) => s.id)
      const { data: weekSets } = await supabase
        .from('workout_sets')
        .select('reps, weight_kg, set_type')
        .in('session_id', ids)

      weekVolume = calcVolume(weekSets ?? [])
    }

    const { data: allSessions } = await supabase
      .from('workout_sessions')
      .select('started_at')
      .not('finished_at', 'is', null)
      .order('started_at', { ascending: false })

    let streak = 0
    if (allSessions && allSessions.length > 0) {
      const sessionDates = new Set(allSessions.map((s) => toDateStr(new Date(s.started_at))))
      const today = toDateStr(now)
      const yesterday = toDateStr(new Date(now.getTime() - 86400000))

      let current = sessionDates.has(today) ? today : sessionDates.has(yesterday) ? yesterday : null
      if (current) {
        const cursor = new Date(current)
        while (sessionDates.has(toDateStr(cursor))) {
          streak++
          cursor.setDate(cursor.getDate() - 1)
        }
      }
    }

    setStats({
      workouts: weekSessions?.length ?? 0,
      volume: weekVolume,
      streak,
    })
    setStatsLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-100">FORGE</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-100 transition-colors"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <Link
          to="/app/workout/start"
          className="flex items-center gap-5 bg-indigo-600 text-white rounded-2xl px-6 py-6 hover:bg-indigo-700 transition-colors"
        >
          <div className="bg-white/15 rounded-xl p-3">
            <Play size={26} fill="white" />
          </div>
          <div>
            <p className="text-lg font-bold">Iniciar entrenamiento</p>
            <p className="text-sm text-indigo-200 mt-0.5">Comenzar una nueva sesión</p>
          </div>
        </Link>

        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Esta semana</h2>
          {statsLoading ? (
            <div className="grid grid-cols-3 gap-3 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-800 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-100">{stats.workouts}</p>
                <p className="text-xs text-gray-500 mt-0.5">entrenos</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-100">
                  {stats.volume > 0 ? stats.volume.toLocaleString('es-AR') : '0'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">kg volumen</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-100">{stats.streak}</p>
                <p className="text-xs text-gray-500 mt-0.5">días racha</p>
              </div>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Explorar</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              to="/app/exercises"
              className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition-colors"
            >
              <div className="bg-gray-800 rounded-lg p-3">
                <Dumbbell size={20} className="text-gray-300" />
              </div>
              <div>
                <p className="font-semibold text-gray-100">Ejercicios</p>
                <p className="text-sm text-gray-500">Explorar catálogo</p>
              </div>
            </Link>

            <Link
              to="/app/history"
              className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition-colors"
            >
              <div className="bg-gray-800 rounded-lg p-3">
                <History size={20} className="text-gray-300" />
              </div>
              <div>
                <p className="font-semibold text-gray-100">Historial</p>
                <p className="text-sm text-gray-500">Ver sesiones</p>
              </div>
            </Link>

            <Link
              to="/app/profile"
              className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition-colors"
            >
              <div className="bg-gray-800 rounded-lg p-3">
                <User size={20} className="text-gray-300" />
              </div>
              <div>
                <p className="font-semibold text-gray-100">Perfil</p>
                <p className="text-sm text-gray-500">Mis datos</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
