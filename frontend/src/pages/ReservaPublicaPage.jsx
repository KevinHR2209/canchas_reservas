import { useEffect, useState } from 'react'
import { getCanchas } from '../services/canchas'
import { getDisponibilidad, createReserva } from '../services/reservas'
import { createCliente, getClientes } from '../services/clientes'
import api from '../services/api' // <-- Necesario para llamar al middleware

const PASOS = ['Tus datos', 'Elige cancha', 'Fecha y hora', 'Confirmar']
const EMPTY_CLIENTE = { nombre: '', apellido: '', telefono: '', email: '', comuna: '' }

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
function validarTelefono(tel) {
  return /^[\d\s+\-()]{7,20}$/.test(tel)
}

export default function ReservaPublicaPage() {
  const [paso, setPaso]             = useState(0)
  const [cliente, setCliente]       = useState(EMPTY_CLIENTE)
  const [clienteId, setClienteId]   = useState(null)
  const [canchas, setCanchas]       = useState([])
  const [cancha, setCancha]         = useState(null)
  const [fecha, setFecha]           = useState('')
  const [bloques, setBloques]       = useState([])
  const [horaInicio, setHoraInicio] = useState('')
  const [loadingBloques, setLoadingBloques] = useState(false)
  const [error, setError]           = useState('')
  const [saving, setSaving]         = useState(false)
  const [exito, setExito]           = useState(false)

  // Estados para el Middleware de Espera
  const [modalEspera, setModalEspera] = useState(false)
  const [bloqueEspera, setBloqueEspera] = useState(null)
  const [loadingEspera, setLoadingEspera] = useState(false)
  const [exitoEspera, setExitoEspera] = useState(false)

  useEffect(() => {
    getCanchas().then(r => setCanchas(r.data.filter(c => c.activa)))
  }, [])

  // ---- PASO 0: datos del cliente ----
  const handleDatos = async (e) => {
    e.preventDefault()
    setError('')
    const { nombre, apellido, telefono, email, comuna } = cliente
    if (!nombre.trim() || !apellido.trim()) { setError('Nombre y apellido son obligatorios'); return }
    if (!validarEmail(email)) { setError('Ingresa un email válido'); return }
    if (!validarTelefono(telefono)) { setError('Ingresa un teléfono válido'); return }
    if (!comuna.trim()) { setError('La comuna es obligatoria'); return }
    setSaving(true)
    try {
      const res = await getClientes()
      const existe = res.data.find(c => c.email.toLowerCase() === email.toLowerCase())
      if (existe) {
        setClienteId(existe.id)
      } else {
        const nuevo = await createCliente({ ...cliente, activo: true })
        setClienteId(nuevo.data.id)
      }
      setPaso(1)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  // ---- PASO 1: elegir cancha ----
  const handleCancha = (c) => { setCancha(c); setFecha(''); setBloques([]); setHoraInicio(''); setPaso(2) }

  // ---- PASO 2: fecha y hora ----
  const handleFecha = async (f) => {
    setFecha(f); setHoraInicio(''); setBloques([])
    if (!f || !cancha) return
    setLoadingBloques(true)
    try {
      const r = await getDisponibilidad(cancha.id, f)
      setBloques(r.data.disponible ? r.data.bloques : [])
    } catch { setBloques([]) }
    finally { setLoadingBloques(false) }
  }

  const handleHora = (h) => { setHoraInicio(h) }

  const handleConfirmarFecha = () => {
    if (!fecha) { setError('Selecciona una fecha'); return }
    if (!horaInicio) { setError('Selecciona una hora'); return }
    setError(''); setPaso(3)
  }

  // ---- PASO 3: confirmar y crear reserva ----
  const handleReservar = async () => {
    setSaving(true); setError('')
    try {
      await createReserva({
        cliente_id: clienteId,
        cancha_id: cancha.id,
        fecha,
        hora_inicio: horaInicio,
      })
      setExito(true)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  // ---- FUNCIONALIDAD MIDDLEWARE: Lista de Espera ----
  const abrirModalEspera = (bloque) => {
    setBloqueEspera(bloque)
    setModalEspera(true)
    setExitoEspera(false)
  }

  const confirmarEspera = async () => {
    setLoadingEspera(true)
    try {
      await api.post('/reservas/middleware/espera', {
        cancha_id: cancha.id,
        fecha: fecha,
        hora_deseada: bloqueEspera.hora,
        nombre: `${cliente.nombre} ${cliente.apellido}`,
        telefono: cliente.telefono,
        email: cliente.email
      })
      setExitoEspera(true)
    } catch (e) {
      setError('Error al registrarse en lista de espera')
    } finally {
      setLoadingEspera(false)
    }
  }

  // ---- ÉXITO ----
  if (exito) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Reserva confirmada!</h2>
            <p className="text-gray-500 mb-6">Te enviamos un email con los detalles y un enlace para cancelar si lo necesitas.</p>
            <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-2 mb-6 text-sm">
              <p><span className="text-gray-500">Cliente:</span> <strong>{cliente.nombre} {cliente.apellido}</strong></p>
              <p><span className="text-gray-500">Cancha:</span> <strong>{cancha?.nombre}</strong></p>
              <p><span className="text-gray-500">Fecha:</span> <strong>{fecha}</strong></p>
              <p><span className="text-gray-500">Hora:</span> <strong>{horaInicio}</strong></p>
            </div>
            <button className="btn btn-primary w-full" onClick={() => { setPaso(0); setExito(false); setCliente(EMPTY_CLIENTE); setCancha(null); setFecha(''); setHoraInicio('') }}>
              Hacer otra reserva
            </button>
          </div>
        </div>
    )
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">

        {/* MODAL LISTA DE ESPERA KRONO */}
        {modalEspera && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8">
                {exitoEspera ? (
                    <div className="text-center">
                      <div className="text-5xl mb-3">⏳</div>
                      <h2 className="text-xl font-bold text-gray-900 mb-2">¡Anotado en lista de espera!</h2>
                      <p className="text-gray-500 text-sm mb-6">
                        Te avisaremos si el bloque de las <strong>{bloqueEspera?.hora}</strong> se desocupa.
                      </p>
                      <button onClick={() => setModalEspera(false)} className="btn btn-primary w-full">Cerrar</button>
                    </div>
                ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900">Lista de espera</h2>
                        <button onClick={() => setModalEspera(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 mb-5">
                        El bloque de las <strong>{bloqueEspera?.hora}</strong> está ocupado. ¿Quieres que te notifiquemos si se libera?
                      </div>
                      <div className="flex gap-3 mt-6">
                        <button onClick={() => setModalEspera(false)} className="btn btn-secondary flex-1">Cancelar</button>
                        <button onClick={confirmarEspera} disabled={loadingEspera} className="btn btn-primary flex-1">
                          {loadingEspera ? 'Registrando...' : 'Sí, avisarme'}
                        </button>
                      </div>
                    </>
                )}
              </div>
            </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-800 to-primary-600 rounded-t-3xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">⚽</span>
              <div>
                <h1 className="font-bold text-lg leading-tight">Canchas Reservas</h1>
                <p className="text-primary-200 text-xs">Reserva tu cancha en minutos</p>
              </div>
            </div>
            {/* Stepper */}
            <div className="flex items-center gap-1">
              {PASOS.map((p, i) => (
                  <div key={i} className="flex items-center gap-1 flex-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        i < paso ? 'bg-white text-primary-700' :
                            i === paso ? 'bg-primary-400 text-white ring-2 ring-white' :
                                'bg-primary-700 text-primary-300'
                    }`}>
                      {i < paso ? '✓' : i + 1}
                    </div>
                    {i < PASOS.length - 1 && (
                        <div className={`flex-1 h-0.5 ${ i < paso ? 'bg-white' : 'bg-primary-600'}`} />
                    )}
                  </div>
              ))}
            </div>
            <p className="text-primary-100 text-xs mt-2">{PASOS[paso]}</p>
          </div>

          <div className="p-6">
            {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">{error}</p>}

            {/* PASO 0: Datos del cliente */}
            {paso === 0 && (
                <form onSubmit={handleDatos} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label">Nombre *</label><input className="input" value={cliente.nombre} onChange={e => setCliente(c=>({...c,nombre:e.target.value}))} /></div>
                    <div><label className="label">Apellido *</label><input className="input" value={cliente.apellido} onChange={e => setCliente(c=>({...c,apellido:e.target.value}))} /></div>
                  </div>
                  <div><label className="label">Teléfono *</label><input className="input" value={cliente.telefono} onChange={e => setCliente(c=>({...c,telefono:e.target.value}))} placeholder="+56 9 1234 5678" /></div>
                  <div><label className="label">Email *</label><input className="input" type="email" value={cliente.email} onChange={e => setCliente(c=>({...c,email:e.target.value}))} /></div>
                  <div><label className="label">Comuna *</label><input className="input" value={cliente.comuna} onChange={e => setCliente(c=>({...c,comuna:e.target.value}))} /></div>
                  <button type="submit" className="btn btn-primary w-full" disabled={saving}>{saving ? 'Verificando...' : 'Continuar'}</button>
                </form>
            )}

            {/* PASO 1: Elegir cancha */}
            {paso === 1 && (
                <div className="space-y-4">
                  <div className="grid gap-3">
                    {canchas.map(c => (
                        <button key={c.id} type="button"
                                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${cancha?.id === c.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}
                                onClick={() => handleCancha(c)}>
                          <span className="text-3xl">{c.tipo === 'padel' ? '🎾' : '⚽'}</span>
                          <div>
                            <p className="font-semibold text-gray-900">{c.nombre}</p>
                            <p className="text-xs text-gray-500">{c.tipo === 'padel' ? 'Pádel' : 'Fútbol 6'}</p>
                          </div>
                        </button>
                    ))}
                  </div>
                  <button className="btn btn-secondary w-full" onClick={() => { setPaso(0); setError('') }}>Volver</button>
                </div>
            )}

            {/* PASO 2: Fecha y hora */}
            {paso === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">Cancha seleccionada: <strong>{cancha?.nombre}</strong></p>
                  <div>
                    <label className="label">Fecha *</label>
                    <input type="date" className="input" value={fecha} min={new Date().toISOString().slice(0,10)} onChange={e => handleFecha(e.target.value)} />
                  </div>

                  {loadingBloques && <p className="text-sm text-gray-400">Cargando horarios...</p>}

                  {!loadingBloques && bloques.length > 0 && (
                      <div>
                        <label className="label">Hora disponible *</label>
                        <p className="text-xs text-gray-400 mb-2">Si un bloque está ocupado, haz clic en el icono del reloj (⏳) para anotarte en la lista de espera.</p>
                        <div className="grid grid-cols-4 gap-2">
                          {bloques.map(b => (
                              <div key={b.hora} className="relative group">
                                <button type="button"
                                        onClick={() => { if (!b.ocupado) handleHora(b.hora) }}
                                        className={`w-full py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                                            b.ocupado ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-default' :
                                                horaInicio === b.hora ? 'bg-primary-600 border-primary-600 text-white shadow-md' :
                                                    'bg-white border-gray-200 text-gray-700 hover:border-primary-400 hover:bg-primary-50'
                                        }`}>
                                  {b.hora}
                                </button>
                                {/* Botón Inyectado del Middleware */}
                                {b.ocupado && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); abrirModalEspera(b); }}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 hover:bg-amber-500 text-white text-[12px] rounded-full flex items-center justify-center shadow-md z-10 transition-transform hover:scale-110"
                                        title="Avisarme si se libera"
                                    >
                                      ⏳
                                    </button>
                                )}
                              </div>
                          ))}
                        </div>
                      </div>
                  )}

                  {!loadingBloques && fecha && bloques.length === 0 && (
                      <p className="text-amber-600 text-sm bg-amber-50 p-3 rounded-xl">Sin horarios para ese día</p>
                  )}

                  <div className="flex gap-3">
                    <button className="btn btn-secondary flex-1" onClick={() => { setPaso(1); setError('') }}>Volver</button>
                    <button className="btn btn-primary flex-1" onClick={handleConfirmarFecha}>Continuar</button>
                  </div>
                </div>
            )}

            {/* PASO 3: Confirmación */}
            {paso === 3 && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Nombre</span><strong>{cliente.nombre} {cliente.apellido}</strong></div>
                    <div className="flex justify-between"><span className="text-gray-500">Cancha</span><strong>{cancha?.nombre}</strong></div>
                    <div className="flex justify-between"><span className="text-gray-500">Fecha</span><strong>{fecha}</strong></div>
                    <div className="flex justify-between"><span className="text-gray-500">Hora</span><strong>{horaInicio}</strong></div>
                  </div>
                  <div className="flex gap-3">
                    <button className="btn btn-secondary flex-1" onClick={() => { setPaso(2); setError('') }}>Volver</button>
                    <button className="btn btn-primary flex-1" onClick={handleReservar} disabled={saving}>{saving ? 'Reservando...' : 'Confirmar reserva'}</button>
                  </div>
                </div>
            )}
          </div>
        </div>
      </div>
  )
}