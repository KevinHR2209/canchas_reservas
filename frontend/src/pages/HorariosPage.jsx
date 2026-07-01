import { useEffect, useState } from 'react'
import { getCanchas, getHorariosPorCancha, createHorario, updateHorario, deleteHorario } from '../services/canchas'

const DIAS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']
const EMPTY = { cancha_id: '', dia_semana: 0, hora_inicio: '08:00', hora_fin: '23:00', activo: true }

export default function HorariosPage() {
  const [canchas, setCanchas]     = useState([])
  const [selCancha, setSelCancha] = useState('')
  const [horarios, setHorarios]   = useState([])
  const [loading, setLoading]     = useState(false)
  const [modal, setModal]         = useState(false)
  const [form, setForm]           = useState(EMPTY)
  const [editId, setEditId]       = useState(null)
  const [error, setError]         = useState('')
  const [saving, setSaving]       = useState(false)

  useEffect(() => { getCanchas().then(r => setCanchas(r.data)) }, [])

  const loadHorarios = (cid) => {
    setLoading(true)
    getHorariosPorCancha(cid).then(r => setHorarios(r.data)).finally(() => setLoading(false))
  }

  const handleSelectCancha = (id) => { setSelCancha(id); loadHorarios(id) }

  const openCreate = () => {
    if (!selCancha) { alert('Selecciona una cancha primero'); return }
    setForm({ ...EMPTY, cancha_id: selCancha })
    setEditId(null); setError(''); setModal(true)
  }
  const openEdit = (h) => {
    setForm({ cancha_id: h.cancha_id, dia_semana: h.dia_semana, hora_inicio: h.hora_inicio.slice(0,5), hora_fin: h.hora_fin.slice(0,5), activo: h.activo })
    setEditId(h.id); setError(''); setModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.hora_inicio >= form.hora_fin) { setError('La hora de inicio debe ser menor a la hora de fin'); return }
    setSaving(true)
    try {
      editId ? await updateHorario(editId, form) : await createHorario(form)
      setModal(false); loadHorarios(selCancha)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar horario?')) return
    try { await deleteHorario(id); loadHorarios(selCancha) } catch (err) { alert(err.message) }
  }

  const sorted = [...horarios].sort((a,b) => a.dia_semana - b.dia_semana)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🕒 Horarios por cancha</h1>
          <p className="text-gray-500 text-sm mt-1">Define los días y horas de operación de cada cancha</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nuevo horario</button>
      </div>

      {/* Selector de cancha */}
      <div className="card p-4 mb-6">
        <label className="label">Selecciona una cancha</label>
        <select className="input max-w-xs" value={selCancha} onChange={e => handleSelectCancha(e.target.value)}>
          <option value="">-- Elige una cancha --</option>
          {canchas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      {!selCancha && <p className="text-center text-gray-400 mt-16">Selecciona una cancha para ver sus horarios</p>}

      {selCancha && (
        loading ? <p className="text-center text-gray-400 mt-16">Cargando...</p> :
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-3 font-medium">Día</th>
                <th className="px-6 py-3 font-medium">Hora inicio</th>
                <th className="px-6 py-3 font-medium">Hora fin</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.length === 0 && (
                <tr><td colSpan={5} className="py-10 text-center text-gray-400">Sin horarios configurados</td></tr>
              )}
              {sorted.map(h => (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium">{DIAS[h.dia_semana]}</td>
                  <td className="px-6 py-3">{h.hora_inicio.slice(0,5)}</td>
                  <td className="px-6 py-3">{h.hora_fin.slice(0,5)}</td>
                  <td className="px-6 py-3">
                    <span className={h.activo ? 'badge-green' : 'badge-gray'}>{h.activo ? 'Activo' : 'Inactivo'}</span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-2 justify-end">
                      <button className="btn btn-secondary text-xs px-3" onClick={() => openEdit(h)}>Editar</button>
                      <button className="btn btn-danger text-xs px-3" onClick={() => handleDelete(h.id)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-gray-900">{editId ? 'Editar horario' : 'Nuevo horario'}</h2>
              <button className="text-gray-400 hover:text-gray-600 text-xl" onClick={() => setModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
              <div>
                <label className="label">Día de la semana *</label>
                <select className="input" value={form.dia_semana} onChange={e => setForm(f=>({...f,dia_semana:+e.target.value}))}>
                  {DIAS.map((d,i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Hora inicio *</label>
                  <input type="time" className="input" value={form.hora_inicio} onChange={e => setForm(f=>({...f,hora_inicio:e.target.value}))} />
                </div>
                <div>
                  <label className="label">Hora fin *</label>
                  <input type="time" className="input" value={form.hora_fin} onChange={e => setForm(f=>({...f,hora_fin:e.target.value}))} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="hactivo" checked={form.activo} onChange={e => setForm(f=>({...f,activo:e.target.checked}))} className="w-4 h-4 text-primary-600" />
                <label htmlFor="hactivo" className="text-sm text-gray-700">Horario activo</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn btn-secondary flex-1" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary flex-1" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
