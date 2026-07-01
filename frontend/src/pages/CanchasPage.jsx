import { useEffect, useState } from 'react'
import { getCanchas, createCancha, updateCancha, deleteCancha } from '../services/canchas'

const TIPOS = [
  { value: 'futbol6', label: '⚽ Fútbol 6' },
  { value: 'padel',   label: '🎸 Pádel' },
]

const EMPTY = { nombre: '', tipo: 'futbol6', descripcion: '', activa: true }

export default function CanchasPage() {
  const [canchas, setCanchas]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState(EMPTY)
  const [editId, setEditId]     = useState(null)
  const [error, setError]       = useState('')
  const [saving, setSaving]     = useState(false)

  const load = () =>
    getCanchas().then((r) => setCanchas(r.data)).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const openCreate = () => { setForm(EMPTY); setEditId(null); setError(''); setModal(true) }
  const openEdit   = (c) => { setForm({ nombre: c.nombre, tipo: c.tipo, descripcion: c.descripcion ?? '', activa: c.activa }); setEditId(c.id); setError(''); setModal(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true)
    try {
      editId ? await updateCancha(editId, form) : await createCancha(form)
      setModal(false)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar cancha?')) return
    try { await deleteCancha(id); load() } catch (err) { alert(err.message) }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Cargando...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">⚽ Canchas</h1>
          <p className="text-gray-500 text-sm mt-1">{canchas.length} cancha{canchas.length !== 1 ? 's' : ''} registrada{canchas.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nueva cancha</button>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {canchas.map((c) => (
          <div key={c.id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{c.tipo === 'padel' ? '🎸' : '⚽'}</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{c.nombre}</p>
                  <p className="text-xs text-gray-500">{TIPOS.find(t => t.value === c.tipo)?.label ?? c.tipo}</p>
                </div>
              </div>
              <span className={c.activa ? 'badge-green' : 'badge-gray'}>
                {c.activa ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            {c.descripcion && <p className="text-xs text-gray-500 mb-4">{c.descripcion}</p>}
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <button className="btn btn-secondary flex-1 text-xs" onClick={() => openEdit(c)}>Editar</button>
              <button className="btn btn-danger flex-1 text-xs" onClick={() => handleDelete(c.id)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-gray-900">{editId ? 'Editar cancha' : 'Nueva cancha'}</h2>
              <button className="text-gray-400 hover:text-gray-600 text-xl" onClick={() => setModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
              <div>
                <label className="label">Nombre *</label>
                <input className="input" value={form.nombre} onChange={e => setForm(f => ({...f, nombre: e.target.value}))} placeholder="Cancha Fútbol 6 - A" />
              </div>
              <div>
                <label className="label">Tipo *</label>
                <select className="input" value={form.tipo} onChange={e => setForm(f => ({...f, tipo: e.target.value}))}>
                  {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Descripción</label>
                <textarea className="input resize-none" rows={3} value={form.descripcion} onChange={e => setForm(f => ({...f, descripcion: e.target.value}))} placeholder="Césped sintético, iluminación LED..." />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="activa" checked={form.activa} onChange={e => setForm(f => ({...f, activa: e.target.checked}))} className="w-4 h-4 text-primary-600" />
                <label htmlFor="activa" className="text-sm text-gray-700">Cancha activa</label>
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
