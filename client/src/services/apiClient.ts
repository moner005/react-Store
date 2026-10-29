import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5001',
  headers: { Accept: 'application/json' },
  timeout: 10_000,
})
