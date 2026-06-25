import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Play, Dumbbell, ArrowLeft } from 'lucide-react'
import { useWorkout } from '../../../hooks/useWorkout'

export default function Start() {
  const navigate = useNavigate()
  const { startSession } = useWorkout()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleStartFree = async () => {
    try {
      setLoading(true)
      setError(null)
      await startSession()
      navigate('/app/workout/active')
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link to="/app/dashboard" className="text-gray-500 hover:text-gray-100 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold text-gray-100">Iniciar entrenamiento</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {/* Free session */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Sesión libre
          </h2>
          <button
            onClick={handleStartFree}
            disabled={loading}
            className="w-full flex items-center gap-4 bg-indigo-600 text-white rounded-xl px-6 py-5 hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            <div className="bg-white/20 rounded-lg p-2">
              <Play size={20} fill="white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-base">
                {loading ? 'Iniciando...' : 'Empezar sesión vacía'}
              </p>
              <p className="text-sm text-indigo-200">Agregá ejercicios sobre la marcha</p>
            </div>
          </button>
        </section>

        {/* Routines — Sprint 5 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Desde una rutina
          </h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-10 text-center">
            <Dumbbell size={32} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 font-medium">Todavía no tenés rutinas</p>
            <p className="text-sm text-gray-500 mt-1">Creá rutinas en el Sprint 5</p>
          </div>
        </section>
      </main>
    </div>
  )
}
