import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import AuthGate from './components/AuthGate.tsx'
import Home from './pages/Home.tsx'
import GameSetup from './pages/GameSetup.tsx'
import GameView from './pages/GameView.tsx'
import RoundForm from './pages/RoundForm.tsx'

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/nova', element: <GameSetup /> },
  { path: '/partida/:id', element: <GameView /> },
  { path: '/partida/:id/rodada', element: <RoundForm /> },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthGate>
      <RouterProvider router={router} />
    </AuthGate>
  </StrictMode>
)
