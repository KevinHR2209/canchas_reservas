import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getReservas } from '../services/reservas'
import { getCanchas } from '../services/canchas'
import { getClientes } from '../services/clientes'

const ESTADO_BADGE = {
  confirmada: 'badge-green',
  completada: 'badge-blue',
  cancelada:  'badge-red',
}

export default function Dashboard() {
  const [stats, setStats]     = useState({ reservas: 0, canchas: 0, clientes: 0, hoy: 0 })
  const [ultimas, setUltimas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getReservas(), getCanchas(), getClientes()])
      .then(([rRes, cRes, clRes]) => {
        const reservas  = rRes.data
        const canchas   = cRes.data
        const clientes  = clRes.data
        const hoy       = new Date().toISOString().slice(0, 10)
        const reservasHoy = reservas.filter((r) => r.fecha === hoy)
        setStats({ reservas: reservas.length, canchas: canchas.length, clientes: clientes.length, hoy: reservasHoy.length })
        setUltimas(reservas.slice(-6).reverse())
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Cargando...</div>

  const cards = [
    { label: 'Reservas totales', value: stats.reservas, icon: '📅', color: 'bg-green-50 text-green-700', link: '/reservas' },
    { label: 'Reservas hoy',     value: stats.hoy,      icon: '⏰', color: 'bg-blue-50 text-blue-700',  link: '/reservas' },
    { label: 'Canchas activas',  value: stats.canchas,  icon: '⚽', color: 'bg-emerald-50 text-emerald-700', link: '/canchas' },
    { label: 'Clientes',         value: stats.clientes, icon: '👥', color: 'bg-purple-50 text-purple-700', link: '/clientes' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen del sistema de reservas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <Link key={c.label} to={c.link}
            className="card p-5 hover:shadow-md transition-shadow">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-xl mb-3 ${c.color}`}>
              {c.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{c.label}</p>
          </Link>
        ))}
      </div>

      {/* Últimas reservas */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Últimas reservas</h2>
          <Link to="/reservas/nueva" className="btn btn-primary text-xs px-3 py-1.5">
            + Nueva reserva
          </Link>
        </div>
        {ultimas.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No hay reservas aún</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-medium">Cliente</th>
                  <th className="pb-2 font-medium">Cancha</th>
                  <th className="pb-2 font-medium">Fecha</th>
                  <th className="pb-2 font-medium">Hora</th>
                  <th className="pb-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ultimas.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="py-2.5 font-medium">
                      {r.cliente ? `${r.cliente.nombre} ${r.cliente.apellido}` : '-'}
                    </td>
                    <td className="py-2.5 text-gray-600">{r.cancha?.nombre ?? '-'}</td>
                    <td className="py-2.5 text-gray-600">{r.fecha}</td>
                    <td className="py-2.5 text-gray-600">{r.hora_inicio?.slice(0,5)}</td>
                    <td className="py-2.5">
                      <span className={ESTADO_BADGE[r.estado] ?? 'badge-gray'}>{r.estado}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
