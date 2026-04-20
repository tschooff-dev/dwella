import { useAuth } from '@clerk/clerk-react'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export function useApi() {
  const { getToken } = useAuth()

  async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
    const token = await getToken()
    return fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    })
  }

  return { apiFetch }
}
