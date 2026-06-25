import { Outlet, NavLink } from 'react-router-dom'
import { Home, Dumbbell, History, User } from 'lucide-react'

const TABS = [
  { to: '/app/dashboard', label: 'Inicio', icon: Home },
  { to: '/app/exercises', label: 'Ejercicios', icon: Dumbbell },
  { to: '/app/history', label: 'Historial', icon: History },
  { to: '/app/profile', label: 'Perfil', icon: User },
]

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Cada página trae su propio header; el Outlet renderiza la ruta activa */}
      <div className="pb-16">
        <Outlet />
      </div>

      {/* Nav inferior persistente para movernos entre secciones al probar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-gray-800 bg-gray-900/95 backdrop-blur">
        <div className="max-w-2xl mx-auto grid grid-cols-4">
          {TABS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-xs transition-colors ${
                  isActive ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
