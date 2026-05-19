import { useAuth } from '@clerk/clerk-react'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

// Module-level cache — survives route changes, cleared on any mutation
const cache = new Map<string, { body: string; ts: number }>()
const STALE_MS = 30_000 // serve cache instantly; background-refresh after 30s

export function useApi() {
  const { getToken } = useAuth()

  async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
    const method = (options?.method ?? 'GET').toUpperCase()
    const isGet = method === 'GET'

    if (isGet) {
      const hit = cache.get(path)
      if (hit) {
        if (Date.now() - hit.ts > STALE_MS) {
          // Stale — serve cache now, refresh in background
          getToken()
            .then(token =>
              fetch(`${API_BASE}${path}`, {
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
              })
            )
            .then(r => (r.ok ? r.text() : null))
            .then(body => { if (body) cache.set(path, { body, ts: Date.now() }) })
            .catch(() => {})
        }
        return new Response(hit.body, {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    const token = await getToken()
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    })

    // Populate cache for successful GET responses
    if (isGet && res.ok) {
      res.clone().text().then(body => cache.set(path, { body, ts: Date.now() }))
    }

    // Any mutation invalidates the whole cache so the next navigation is fresh
    if (!isGet) {
      cache.clear()
    }

    return res
  }

  return { apiFetch }
}
