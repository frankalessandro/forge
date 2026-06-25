import { createBrowserRouter, redirect } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './routes/auth/Login'
import Register from './routes/auth/Register'
import Dashboard from './routes/app/Dashboard'
import Exercises from './routes/app/Exercises'
import ExerciseDetail from './routes/app/ExerciseDetail'
import Start from './routes/app/workout/Start'
import Active from './routes/app/workout/Active'
import Summary from './routes/app/workout/Summary'

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

export const router = createBrowserRouter([
  {
    path: '/',
    loader: () => redirect('/app/dashboard'),
  },
  {
    path: '/login',
    loader: redirectIfAuth,
    element: <Login />,
  },
  {
    path: '/register',
    loader: redirectIfAuth,
    element: <Register />,
  },
  {
    path: '/app',
    loader: requireAuth,
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'exercises',
        element: <Exercises />,
      },
      {
        path: 'exercises/:id',
        element: <ExerciseDetail />,
      },
      {
        path: 'workout/start',
        element: <Start />,
      },
      {
        path: 'workout/active',
        element: <Active />,
      },
      {
        path: 'workout/summary/:sessionId',
        element: <Summary />,
      },
    ],
  },
])
