/* eslint-disable react-refresh/only-export-components --
   Este archivo es la definición del router: exporta `router` (no un componente)
   junto a los guards y lazies. Fast refresh no aplica a un archivo de rutas. */
import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Splash from './components/ui/Splash'

// Lazy: cada ruta se descarga en su propio chunk (carga inicial mucho más liviana;
// recharts, por ejemplo, queda aislado en el chunk del Perfil).
const Landing = lazy(() => import('./routes/Landing'))
const Login = lazy(() => import('./routes/auth/Login'))
const Register = lazy(() => import('./routes/auth/Register'))
const AppLayout = lazy(() => import('./routes/app/AppLayout'))
const Dashboard = lazy(() => import('./routes/app/Dashboard'))
const Exercises = lazy(() => import('./routes/app/Exercises'))
const ExerciseDetail = lazy(() => import('./routes/app/ExerciseDetail'))
const Routines = lazy(() => import('./routes/app/Routines'))
const RoutineDetail = lazy(() => import('./routes/app/RoutineDetail'))
const RoutineEditor = lazy(() => import('./routes/app/RoutineEditor'))
const Schedule = lazy(() => import('./routes/app/Schedule'))
const Start = lazy(() => import('./routes/app/workout/Start'))
const Active = lazy(() => import('./routes/app/workout/Active'))
const Summary = lazy(() => import('./routes/app/workout/Summary'))
const Profile = lazy(() => import('./routes/app/Profile'))
const ProfileEdit = lazy(() => import('./routes/app/ProfileEdit'))
const Achievements = lazy(() => import('./routes/app/Achievements'))
const Streak = lazy(() => import('./routes/app/Streak'))
const History = lazy(() => import('./routes/app/History'))
const HistoryDetail = lazy(() => import('./routes/app/HistoryDetail'))
const Friends = lazy(() => import('./routes/app/Friends'))
const PublicProfile = lazy(() => import('./routes/app/PublicProfile'))
const FriendWorkouts = lazy(() => import('./routes/app/FriendWorkouts'))
const FriendWorkoutDetail = lazy(() => import('./routes/app/FriendWorkoutDetail'))
const Onboarding = lazy(() => import('./routes/app/Onboarding'))

function page(node) {
  return <Suspense fallback={<Splash />}>{node}</Suspense>
}

// Rutas protegidas. Render optimista: si hay sesión (aunque sea el seed de
// localStorage) entramos ya; si todavía no confirmamos nada mostramos el splash;
// solo redirigimos a login cuando supabase confirmó que no hay sesión.
function RequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const ready = useAuthStore((s) => s.ready)
  if (isAuthenticated) return <Outlet />
  if (!ready) return <Splash />
  return <Navigate to="/login" replace />
}

// Rutas de invitado (login / registro). Si ya hay sesión, al dashboard
// (o a la encuesta de onboarding si todavía no completó el perfil).
// El seed síncrono cubre el caso del usuario logueado: nunca flashea el login.
function GuestOnly() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const needsOnboarding = useAuthStore((s) => s.needsOnboarding)
  if (isAuthenticated) return <Navigate to={needsOnboarding ? '/app/onboarding' : '/app/dashboard'} replace />
  return <Outlet />
}

function RootRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const ready = useAuthStore((s) => s.ready)
  const needsOnboarding = useAuthStore((s) => s.needsOnboarding)
  if (!ready) return <Splash />
  if (!isAuthenticated) return page(<Landing />)
  if (needsOnboarding) return <Navigate to="/app/onboarding" replace />
  return <Navigate to="/app/dashboard" replace />
}

export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  {
    element: <GuestOnly />,
    children: [
      { path: '/login', element: page(<Login />) },
      { path: '/register', element: page(<Register />) },
    ],
  },
  {
    path: '/app',
    element: <RequireAuth />,
    children: [
      { path: 'onboarding', element: page(<Onboarding />) },
      {
        element: page(<AppLayout />),
        children: [
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'exercises', element: <Exercises /> },
          { path: 'exercises/:id', element: <ExerciseDetail /> },
          { path: 'routines', element: <Routines /> },
          { path: 'routines/new', element: <RoutineEditor /> },
          { path: 'routines/:id', element: <RoutineDetail /> },
          { path: 'routines/:id/edit', element: <RoutineEditor /> },
          { path: 'schedule', element: <Schedule /> },
          { path: 'workout/start', element: <Start /> },
          { path: 'workout/active', element: <Active /> },
          { path: 'workout/summary/:sessionId', element: <Summary /> },
          { path: 'profile', element: <Profile /> },
          { path: 'profile/edit', element: <ProfileEdit /> },
          { path: 'profile/achievements', element: <Achievements /> },
          { path: 'streak', element: <Streak /> },
          { path: 'friends', element: <Friends /> },
          { path: 'u/:userId', element: <PublicProfile /> },
          { path: 'u/:userId/workouts', element: <FriendWorkouts /> },
          { path: 'u/:userId/workouts/:sessionId', element: <FriendWorkoutDetail /> },
          { path: 'history', element: <History /> },
          { path: 'history/:sessionId', element: <HistoryDetail /> },
        ],
      },
    ],
  },
])
