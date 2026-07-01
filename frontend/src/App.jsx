import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import CanchasPage from './pages/CanchasPage'
import ClientesPage from './pages/ClientesPage'
import HorariosPage from './pages/HorariosPage'
import ReservasPage from './pages/ReservasPage'
import NuevaReservaPage from './pages/NuevaReservaPage'
import ReservaPublicaPage from './pages/ReservaPublicaPage'

export default function App() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1 ml-64 p-8">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/canchas" element={<CanchasPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/horarios" element={<HorariosPage />} />
          <Route path="/reservas" element={<ReservasPage />} />
          <Route path="/reservas/nueva" element={<NuevaReservaPage />} />
          <Route path="/reservar" element={<ReservaPublicaPage />} />
        </Routes>
      </main>
    </div>
  )
}
