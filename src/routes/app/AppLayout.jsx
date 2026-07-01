import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Home, ClipboardList, TrendingUp, User, Plus, Play, Dumbbell, Scale, X } from 'lucide-react'
import { useWorkout } from '../../hooks/useWorkout'
import { useWorkoutStore } from '../../stores/workoutStore'
import Sheet from '../../components/ui/Sheet'
import { Toaster } from 'sileo'

const TABS = [
  { to: '/app/dashboard', label: 'Inicio', icon: Home },
  { to: '/app/routines', label: 'Rutinas', icon: ClipboardList },
  { to: '/app/history', label: 'Progreso', icon: TrendingUp },
  { to: '/app/profile', label: 'Perfil', icon: User },
]

function QuickAction({ icon: Icon, title, subtitle, onClick, accent }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 rounded-2xl px-4 py-3.5 mb-2 text-left transition-colors bg-ink-850 border border-ink-800 hover:border-ink-600"
    >
      <div
        className={`rounded-xl p-2.5 shrink-0 ${
          accent ? 'bg-accent text-ink-950' : 'bg-ink-800 text-accent'
        }`}
      >
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="display text-sm text-zinc-100">{title}</p>
        <p className="text-xs text-zinc-500">{subtitle}</p>
      </div>
    </button>
  )
}

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { startSession } = useWorkout()
  const isWorkoutActive = useWorkoutStore((s) => s.isActive)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [starting, setStarting] = useState(false)

  // El entrenamiento activo es pantalla completa: ocultamos el nav.
  const hideNav = location.pathname.startsWith('/app/workout/active')

  const handleStartFree = async () => {
    // Ya hay un entreno en curso (persistido): lo retomamos en vez de crear otro.
    if (isWorkoutActive) {
      setSheetOpen(false)
      navigate('/app/workout/active')
      return
    }
    try {
      setStarting(true)
      await startSession()
      setSheetOpen(false)
      navigate('/app/workout/active')
    } catch {
      setStarting(false)
    }
  }

  const go = (path) => {
    setSheetOpen(false)
    navigate(path)
  }

  return (
    <div className="min-h-screen bg-ink-950">
      <Toaster position="top-right" theme="light" />

      <div className={hideNav ? '' : 'pb-24'}>
        <Outlet />
      </div>

      {!hideNav && (
        <>
          {/* Tab bar */}
          <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-ink-800 bg-ink-900/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
            <div className="max-w-2xl mx-auto grid grid-cols-5 items-center h-16">
              {TABS.slice(0, 2).map((t) => (
                <Tab key={t.to} {...t} />
              ))}

              {/* Slot central: FAB */}
              <div className="flex justify-center">
                <button
                  onClick={() => setSheetOpen(true)}
                  className="-mt-7 w-14 h-14 rounded-2xl bg-accent text-ink-950 flex items-center justify-center glow-accent hover:bg-accent-bright active:scale-95 transition-all"
                  aria-label="Acciones rápidas"
                >
                  <Plus size={26} strokeWidth={2.5} />
                </button>
              </div>

              {TABS.slice(2).map((t) => (
                <Tab key={t.to} {...t} />
              ))}
            </div>
          </nav>

          <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="¿Qué quieres hacer?">
            <QuickAction
              icon={Play}
              title={starting ? 'Iniciando…' : 'Entrenar libre'}
              subtitle="Sesión vacía, agrega sobre la marcha"
              onClick={handleStartFree}
              accent
            />
            <QuickAction
              icon={ClipboardList}
              title="Desde una rutina"
              subtitle="Elige una plantilla o la tuya"
              onClick={() => go('/app/workout/start')}
            />
            <QuickAction
              icon={Dumbbell}
              title="Explorar ejercicios"
              subtitle="Catálogo y músculos que trabajan"
              onClick={() => go('/app/exercises')}
            />
            <QuickAction
              icon={Scale}
              title="Registrar peso"
              subtitle="Actualiza tu progreso corporal"
              onClick={() => go('/app/profile')}
            />
            <button
              onClick={() => setSheetOpen(false)}
              className="w-full flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300 py-3 mt-1 text-sm transition-colors"
            >
              <X size={16} />
              Cerrar
            </button>
          </Sheet>
        </>
      )}
    </div>
  )
}

function Tab({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 py-3 text-[10px] font-display uppercase tracking-wider transition-colors ${
          isActive ? 'text-accent' : 'text-zinc-500 hover:text-zinc-300'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
          {label}
        </>
      )}
    </NavLink>
  )
}
