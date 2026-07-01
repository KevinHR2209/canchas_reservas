import { useEffect, useState } from 'react'
import { getClientes, createCliente, updateCliente, deleteCliente } from '../services/clientes'

const EMPTY = { nombre: '', apellido: '', telefono: '', email: '', comuna: '', activo: true }

export default function ClientesPage() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState(EMPTY)
  const [editId, setEditId]     = useState(null)
  const [error, setError]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [search, setSearch]     = useState('')

  const load = () =>
    getClientes().then((r) => setClientes(r.data)).finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const openCreate = () => { setForm(EMPTY); setEditId(null); setError(''); setModal(true) }
  const openEdit   = (c) => {
    setForm({ nombre: c.nombre, apellido: c.apellido, telefono: c.telefono, email: c.email, comuna: c.comuna ?? '', activo: c.activo })
    setEditId(c.id); setError(''); setModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim() || !form.apellido.trim()) { setError('Nombre y apellido son obligatorios'); return }
    if (!form.email.trim()) { setError('El email es obligatorio'); return }
    if (!form.telefono.trim()) { setError('El teléfono es obligatorio'); return }
    if (!form.comuna.trim()) { setError('La comuna es obligatoria'); return }
    setSaving(true)
    try {
      editId ? await updateCliente(editId, form) : await createCliente(form)
      setModal(false); load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar cliente?')) return
    try { await deleteCliente(id); load() } catch (err) { alert(err.message) }
  }

  const filtered = clientes.filter(c =>
    `${c.nombre} ${c.apellido} ${c.email} ${c.telefono} ${c.comuna ?? ''}`.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Cargando...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">👥 Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">{clientes.length} cliente{clientes.length !== 1 ? 's' : ''} registrado{clientes.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Nuevo cliente</button>
      </div>

      <div className="card p-6">
        <input className="input mb-4 max-w-xs" placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-2 font-medium">Nombre</th>
                <th className="pb-2 font-medium">Teléfono</th>
                <th className="pb-2 font-medium">Email</th>
                <th className="pb-2 font-medium">Comuna</th>
                <th className="pb-2 font-medium">Estado</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400">No hay clientes</td></tr>
              )}
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="py-3 font-medium">{c.nombre} {c.apellido}</td>
                  <td className="py-3 text-gray-600">{c.telefono}</td>
                  <td className="py-3 text-gray-600">{c.email}</td>
                  <td className="py-3 text-gray-600">{c.comuna ?? '-'}</td>
                  <td className="py-3">
                    <span className={c.activo ? 'badge-green' : 'badge-gray'}>{c.activo ? 'Activo' : 'Inactivo'}</span>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2 justify-end">
                      <button className="btn btn-secondary text-xs px-3" onClick={() => openEdit(c)}>Editar</button>
                      <button className="btn btn-danger text-xs px-3" onClick={() => handleDelete(c.id)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-gray-900">{editId ? 'Editar cliente' : 'Nuevo cliente'}</h2>
              <button className="text-gray-400 hover:text-gray-600 text-xl" onClick={() => setModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Nombre *</label>
                  <input className="input" value={form.nombre} onChange={e => setForm(f=>({...f,nombre:e.target.value}))} />
                </div>
                <div>
                  <label className="label">Apellido *</label>
                  <input className="input" value={form.apellido} onChange={e => setForm(f=>({...f,apellido:e.target.value}))} />
                </div>
              </div>
              <div>
                <label className="label">Teléfono *</label>
                <input className="input" value={form.telefono} onChange={e => setForm(f=>({...f,telefono:e.target.value}))} placeholder="+56 9 1234 5678" />
              </div>
              <div>
                <label className="label">Email *</label>
                <input className="input" type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} />
              </div>
              <div>
                <label className="label">Comuna *</label>
                <input className="input" value={form.comuna} onChange={e => setForm(f=>({...f,comuna:e.target.value}))} placeholder="Viña del Mar" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="activo" checked={form.activo} onChange={e => setForm(f=>({...f,activo:e.target.checked}))} className="w-4 h-4 text-primary-600" />
                <label htmlFor="activo" className="text-sm text-gray-700">Cliente activo</label>
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
