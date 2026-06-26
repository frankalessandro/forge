import { createBrowserRouter, redirect } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './routes/auth/Login'
import Register from './routes/auth/Register'
import AppLayout from './routes/app/AppLayout'
import Dashboard from './routes/app/Dashboard'
import Exercises from './routes/app/Exercises'
import ExerciseDetail from './routes/app/ExerciseDetail'
import Routines from './routes/app/Routines'
import RoutineDetail from './routes/app/RoutineDetail'
import RoutineEditor from './routes/app/RoutineEditor'
import Start from './routes/app/workout/Start'
import Active from './routes/app/workout/Active'
import Summary from './routes/app/workout/Summary'
import Profile from './routes/app/Profile'
import History from './routes/app/History'
import HistoryDetail from './routes/app/HistoryDetail'

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
  { path: '/login', loader: redirectIfAuth, element: <Login /> },
  { path: '/register', loader: redirectIfAuth, element: <Register /> },
  {
    path: '/app',
    loader: requireAuth,
    element: <AppLayout />,
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
      { path: 'history', element: <History /> },
      { path: 'history/:sessionId', element: <HistoryDetail /> },
    ],
  },
])
