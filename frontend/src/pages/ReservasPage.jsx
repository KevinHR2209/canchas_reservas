import { useEffect, useState } from 'react'
import { getReservas, updateEstadoReserva } from '../services/reservas'
import { Link } from 'react-router-dom'

const ESTADO_BADGE = {
  confirmada: 'badge-green',
  completada: 'badge-blue',
  cancelada:  'badge-red',
}
const ESTADOS = ['confirmada','completada','cancelada']

export default function ReservasPage() {
  const [reservas, setReservas]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [filtroEstado, setFiltro] = useState('')
  const [search, setSearch]       = useState('')

  const load = () =>
    getReservas().then(r => setReservas(r.data)).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const handleEstado = async (id, estado) => {
    try { await updateEstadoReserva(id, estado); load() } catch (err) { alert(err.message) }
  }

  const filtered = reservas.filter(r => {
    const texto = `${r.cliente?.nombre ?? ''} ${r.cliente?.apellido ?? ''} ${r.cancha?.nombre ?? ''}`.toLowerCase()
    const matchSearch = texto.includes(search.toLowerCase())
    const matchEstado = filtroEstado ? r.estado === filtroEstado : true
    return matchSearch && matchEstado
  })

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Cargando...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📅 Reservas</h1>
          <p className="text-gray-500 text-sm mt-1">{reservas.length} reserva{reservas.length !== 1 ? 's' : ''} en total</p>
        </div>
        <Link to="/reservas/nueva" className="btn btn-primary">+ Nueva reserva</Link>
      </div>

      <div className="card p-6">
        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-5">
          <input className="input max-w-xs" placeholder="Buscar cliente o cancha..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="input w-44" value={filtroEstado} onChange={e => setFiltro(e.target.value)}>
            <option value="">Todos los estados</option>
            {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-2 font-medium">Cliente</th>
                <th className="pb-2 font-medium">Cancha</th>
                <th className="pb-2 font-medium">Fecha</th>
                <th className="pb-2 font-medium">Hora</th>
                <th className="pb-2 font-medium">Estado</th>
                <th className="pb-2 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400">No hay reservas</td></tr>
              )}
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="py-3 font-medium">
                    <p>{r.cliente?.nombre} {r.cliente?.apellido}</p>
                    <p className="text-xs text-gray-400">{r.cliente?.telefono}</p>
                  </td>
                  <td className="py-3">
                    <p>{r.cancha?.nombre}</p>
                    <p className="text-xs text-gray-400">{r.cancha?.tipo === 'padel' ? '🎸 Pádel' : '⚽ Fútbol 6'}</p>
                  </td>
                  <td className="py-3 text-gray-600">{r.fecha}</td>
                  <td className="py-3 text-gray-600">{r.hora_inicio?.slice(0,5)} – {r.hora_fin?.slice(0,5)}</td>
                  <td className="py-3">
                    <span className={ESTADO_BADGE[r.estado] ?? 'badge-gray'}>{r.estado}</span>
                  </td>
                  <td className="py-3">
                    {r.estado === 'confirmada' && (
                      <div className="flex gap-1">
                        <button className="btn btn-secondary text-xs px-2 py-1" onClick={() => handleEstado(r.id,'completada')}>Completar</button>
                        <button className="btn btn-danger text-xs px-2 py-1" onClick={() => handleEstado(r.id,'cancelada')}>Cancelar</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
