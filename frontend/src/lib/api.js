import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || ''

const api = axios.create({ baseURL: BASE })

// Attach JWT automatically
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('pt_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Auto-refresh on 401
api.interceptors.response.use(
  r => r,
  async err => {
    const orig = err.config
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true
      const refresh = localStorage.getItem('pt_refresh')
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE}/api/auth/refresh`, {}, {
            headers: { Authorization: `Bearer ${refresh}` }
          })
          localStorage.setItem('pt_token', data.access_token)
          orig.headers.Authorization = `Bearer ${data.access_token}`
          return api(orig)
        } catch {
          localStorage.removeItem('pt_token')
          localStorage.removeItem('pt_refresh')
        }
      }
    }
    return Promise.reject(err)
  }
)

export default api
