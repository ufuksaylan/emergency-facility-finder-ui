// src/api/client.js
import axios from 'axios'

// Use environment variable for base URL (good practice)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api' // Provide a default or ensure VITE_API_BASE_URL is set

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// --- Request Interceptor ---
// This function runs BEFORE any request using apiClient is sent
apiClient.interceptors.request.use(
  (config) => {
    // Get the token from Local Storage (or wherever you store it)
    const token = localStorage.getItem('adminAuthToken')

    // Check if the token exists
    if (token) {
      // If token exists, add the Authorization header
      // Assumes your backend expects 'Bearer <token>' format
      config.headers.Authorization = `Bearer ${token}`
      console.log('Interceptor: Added Auth header to request:', config.url) // Optional: for debugging
    } else {
      console.log('Interceptor: No token found, sending request without Auth header:', config.url) // Optional: for debugging
    }

    // **Important:** Return the modified config object
    return config
  },
  (error) => {
    // Handle request configuration errors (less common)
    console.error('Axios request interceptor error:', error)
    return Promise.reject(error)
  },
)

// --- Response Interceptor (Optional but Recommended) ---
// You already had a basic one, let's enhance it slightly
apiClient.interceptors.response.use(
  (response) => {
    // Any status code within the range of 2xx causes this function to trigger
    return response
  },
  (error) => {
    // Any status codes outside the range of 2xx cause this function to trigger
    console.error('API Error Response:', error.response || error.message || error)

    // Example: Handle 401 Unauthorized (e.g., token expired) globally
    if (error.response && error.response.status === 401) {
      console.error('Unauthorized (401). Token might be expired or invalid.')
      // Optional: Clear stored token and redirect to login
      localStorage.removeItem('adminAuthToken')
      localStorage.removeItem('adminUser')
      // Avoid infinite loops if login page itself causes 401
      if (window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login' // Force reload to login
      }
    }

    // Forward the error so components can handle specific errors if needed
    return Promise.reject(error)
  },
)

export default apiClient
