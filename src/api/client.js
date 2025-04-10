import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminAuthToken')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('Interceptor: Added Auth header to request:', config.url)
    } else {
      console.log('Interceptor: No token found, sending request without Auth header:', config.url)
    }

    return config
  },
  (error) => {
    console.error('Axios request interceptor error:', error)
    return Promise.reject(error)
  },
)

apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('API Error Response:', error.response || error.message || error)

    if (error.response && error.response.status === 401) {
      console.error('Unauthorized (401). Token might be expired or invalid.')
      localStorage.removeItem('adminAuthToken')
      localStorage.removeItem('adminUser')
      if (window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login'
      }
    }

    return Promise.reject(error)
  },
)

export default apiClient
