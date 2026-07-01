import api from './api'

export const getCanchas = () => api.get('/canchas/')
export const getCancha = (id) => api.get(`/canchas/${id}`)
export const createCancha = (data) => api.post('/canchas/', data)
export const updateCancha = (id, data) => api.patch(`/canchas/${id}`, data)
export const deleteCancha = (id) => api.delete(`/canchas/${id}`)

export const getHorariosPorCancha = (canchaId) =>
  api.get(`/horarios/cancha/${canchaId}`)
export const createHorario = (data) => api.post('/horarios/', data)
export const updateHorario = (id, data) => api.patch(`/horarios/${id}`, data)
export const deleteHorario = (id) => api.delete(`/horarios/${id}`)
