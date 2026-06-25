import { useNavigate, Link } from 'react-router-dom'
import { LogOut, Dumbbell, Play } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function Dashboard() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">FORGE</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Start workout CTA */}
        <Link
          to="/app/workout/start"
          className="flex items-center gap-5 bg-gray-900 text-white rounded-2xl px-6 py-6 hover:bg-gray-800 transition-colors"
        >
          <div className="bg-white/15 rounded-xl p-3">
            <Play size={26} fill="white" />
          </div>
          <div>
            <p className="text-lg font-bold">Iniciar entrenamiento</p>
            <p className="text-sm text-gray-300 mt-0.5">Comenzar una nueva sesión</p>
          </div>
        </Link>

        {/* Secondary navigation */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Explorar</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              to="/app/exercises"
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-400 transition-colors"
            >
              <div className="bg-gray-100 rounded-lg p-3">
                <Dumbbell size={20} className="text-gray-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Ejercicios</p>
                <p className="text-sm text-gray-500">Explorar catálogo</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
