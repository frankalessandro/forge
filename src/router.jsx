import { lazy, Suspense } from 'react'
import { createBrowserRouter, redirect } from 'react-router-dom'
import { supabase } from './lib/supabase'

// Lazy: cada ruta se descarga en su propio chunk (carga inicial mucho más liviana;
// recharts, por ejemplo, queda aislado en el chunk del Perfil).
const Login = lazy(() => import('./routes/auth/Login'))
const Register = lazy(() => import('./routes/auth/Register'))
const AppLayout = lazy(() => import('./routes/app/AppLayout'))
const Dashboard = lazy(() => import('./routes/app/Dashboard'))
const Exercises = lazy(() => import('./routes/app/Exercises'))
const ExerciseDetail = lazy(() => import('./routes/app/ExerciseDetail'))
const Routines = lazy(() => import('./routes/app/Routines'))
const RoutineDetail = lazy(() => import('./routes/app/RoutineDetail'))
const RoutineEditor = lazy(() => import('./routes/app/RoutineEditor'))
const Start = lazy(() => import('./routes/app/workout/Start'))
const Active = lazy(() => import('./routes/app/workout/Active'))
const Summary = lazy(() => import('./routes/app/workout/Summary'))
const Profile = lazy(() => import('./routes/app/Profile'))
const History = lazy(() => import('./routes/app/History'))
const HistoryDetail = lazy(() => import('./routes/app/HistoryDetail'))
const Friends = lazy(() => import('./routes/app/Friends'))
const PublicProfile = lazy(() => import('./routes/app/PublicProfile'))

function Fallback() {
  return <div className="min-h-screen bg-ink-950" />
}

function page(node) {
  return <Suspense fallback={<Fallback />}>{node}</Suspense>
}

async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw redirect('/login')
  return null
}
async function redirectIfAuth() {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) throw redirect('/app/dashboard')
  return null
}
async function rootRedirect() {
  const { data: { session } } = await supabase.auth.getSession()
  throw redirect(session ? '/app/dashboard' : '/login')
}

export const router = createBrowserRouter([
  { path: '/', loader: rootRedirect },
  { path: '/login', loader: redirectIfAuth, element: page(<Login />) },
  { path: '/register', loader: redirectIfAuth, element: page(<Register />) },
  {
    path: '/app',
    loader: requireAuth,
    element: page(<AppLayout />),
    children: [
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'exercises', element: <Exercises /> },
      { path: 'exercises/:id', element: <ExerciseDetail /> },
      { path: 'routines', element: <Routines /> },
      { path: 'routines/new', element: <RoutineEditor /> },
      { path: 'routines/:id', element: <RoutineDetail /> },
      { path: 'routines/:id/edit', element: <RoutineEditor /> },
      { path: 'workout/start', element: <Start /> },
      { path: 'workout/active', element: <Active /> },
      { path: 'workout/summary/:sessionId', element: <Summary /> },
      { path: 'profile', element: <Profile /> },
      { path: 'friends', element: <Friends /> },
      { path: 'u/:userId', element: <PublicProfile /> },
      { path: 'history', element: <History /> },
      { path: 'history/:sessionId', element: <HistoryDetail /> },
    ],
  },
])
