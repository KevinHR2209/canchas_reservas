import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const detail = err.response?.data?.detail

    let msg = 'Error de conexión con el servidor'

    if (detail) {
      if (typeof detail === 'string') {
        msg = detail
      } else if (Array.isArray(detail)) {
        // FastAPI devuelve errores de validación como array de objetos
        msg = detail.map((e) => e.msg ?? JSON.stringify(e)).join(', ')
      } else if (typeof detail === 'object') {
        msg = detail.message ?? JSON.stringify(detail)
      }
    } else if (err.response?.data?.message) {
      msg = err.response.data.message
    }

    return Promise.reject(new Error(msg))
  }
)

export default api
