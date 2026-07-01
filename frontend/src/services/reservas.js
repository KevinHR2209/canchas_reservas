import api from './api'

export const getReservas = () => api.get('/reservas/')
export const getReserva = (id) => api.get(`/reservas/${id}`)
export const getReservasPorCancha = (canchaId) =>
  api.get(`/reservas/cancha/${canchaId}`)
export const getDisponibilidad = (canchaId, fecha) =>
  api.get(`/reservas/disponibilidad/${canchaId}/${fecha}`)
export const createReserva = (data) => api.post('/reservas/', data)
export const updateEstadoReserva = (id, estado) =>
  api.patch(`/reservas/${id}/estado`, { estado })
