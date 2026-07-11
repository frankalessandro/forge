import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './router'
import { useAuthStore } from './stores/authStore'

// Arranca la confirmación de sesión (getSession + listener) una sola vez,
// en paralelo al render. El render no la espera: usa el seed optimista.
useAuthStore.getState().init()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  <h1>Hola</h1>
  </StrictMode>,
)
