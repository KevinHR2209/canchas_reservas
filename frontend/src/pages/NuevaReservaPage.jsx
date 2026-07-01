import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCanchas } from '../services/canchas'
import { getClientes } from '../services/clientes'
import { getDisponibilidad, createReserva } from '../services/reservas'

export default function NuevaReservaPage() {
  const navigate = useNavigate()
  const [canchas, setCanchas]   = useState([])
  const [clientes, setClientes] = useState([])
  const [form, setForm]         = useState({ cliente_id: '', cancha_id: '', fecha: '', hora_inicio: '', notas: '' })
  const [bloques, setBloques]   = useState([])
  const [loadingBloques, setLoadingBloques] = useState(false)
  const [error, setError]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [search, setSearch]     = useState('')

  useEffect(() => {
    getCanchas().then(r => setCanchas(r.data.filter(c => c.activa)))
    getClientes().then(r => setClientes(r.data.filter(c => c.activo)))
  }, [])

  const handleCanchaFecha = async (cancha_id, fecha) => {
    setForm(f => ({ ...f, cancha_id, fecha, hora_inicio: '' }))
    setBloques([])
    if (!cancha_id || !fecha) return
    setLoadingBloques(true)
    try {
      const r = await getDisponibilidad(cancha_id, fecha)
      setBloques(r.data.bloques ?? [])
    } catch { setBloques([]) }
    finally { setLoadingBloques(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const { cliente_id, cancha_id, fecha, hora_inicio } = form
    if (!cliente_id || !cancha_id || !fecha || !hora_inicio) { setError('Todos los campos marcados con * son obligatorios'); return }
    setSaving(true)
    try {
      await createReserva({ cliente_id, cancha_id, fecha, hora_inicio, notas: form.notas })
      navigate('/reservas')
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  const clientesFiltrados = clientes.filter(c =>
    `${c.nombre} ${c.apellido} ${c.telefono}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📅 Nueva reserva (admin)</h1>
        <p className="text-gray-500 text-sm mt-1">Asigna una cancha a un cliente registrado</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}

        {/* Cliente */}
        <div>
          <label className="label">Cliente *</label>
          <input className="input mb-2" placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="input" value={form.cliente_id} onChange={e => setForm(f=>({...f,cliente_id:e.target.value}))} required>
            <option value="">-- Selecciona un cliente --</option>
            {clientesFiltrados.map(c => (
              <option key={c.id} value={c.id}>{c.nombre} {c.apellido} — {c.telefono}</option>
            ))}
          </select>
        </div>

        {/* Cancha */}
        <div>
          <label className="label">Cancha *</label>
          <select className="input" value={form.cancha_id}
            onChange={e => handleCanchaFecha(e.target.value, form.fecha)} required>
            <option value="">-- Selecciona una cancha --</option>
            {canchas.map(c => (
              <option key={c.id} value={c.id}>
                {c.tipo === 'padel' ? '🎸' : '⚽'} {c.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha */}
        <div>
          <label className="label">Fecha *</label>
          <input type="date" className="input" value={form.fecha}
            min={new Date().toISOString().slice(0,10)}
            onChange={e => handleCanchaFecha(form.cancha_id, e.target.value)} required />
        </div>

        {/* Bloques disponibles */}
        {loadingBloques && <p className="text-sm text-gray-400">Cargando disponibilidad...</p>}
        {!loadingBloques && bloques.length > 0 && (
          <div>
            <label className="label">Hora *</label>
            <div className="grid grid-cols-4 gap-2">
              {bloques.map(b => (
                <button key={b.hora} type="button"
                  disabled={b.ocupado}
                  onClick={() => setForm(f => ({...f, hora_inicio: b.hora}))}
                  className={`py-2 rounded-lg text-sm font-medium border transition-all
                    ${ b.ocupado
                      ? 'bg-red-50 border-red-200 text-red-400 cursor-not-allowed'
                      : form.hora_inicio === b.hora
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-primary-400'
                    }`}>
                  {b.hora}
                  {b.ocupado && <span className="block text-xs">Ocupado</span>}
                </button>
              ))}
            </div>
          </div>
        )}
        {!loadingBloques && form.cancha_id && form.fecha && bloques.length === 0 && (
          <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
            ⚠️ La cancha no tiene horario configurado para ese día.
          </p>
        )}

        {/* Notas */}
        <div>
          <label className="label">Notas (opcional)</label>
          <textarea className="input resize-none" rows={2} value={form.notas} onChange={e => setForm(f=>({...f,notas:e.target.value}))} placeholder="Observaciones..." />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" className="btn btn-secondary flex-1" onClick={() => navigate('/reservas')}>Cancelar</button>
          <button type="submit" className="btn btn-primary flex-1" disabled={saving}>{saving ? 'Guardando...' : 'Crear reserva'}</button>
        </div>
      </form>
    </div>
  )
}
