import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useApi } from './api'
import i18n from './i18n'

type Settings = {
  companyName: string
  timezone: string
  language: string
  [key: string]: unknown
}

type SettingsCtx = {
  settings: Settings | null
  refresh: () => void
}

const SettingsContext = createContext<SettingsCtx>({ settings: null, refresh: () => {} })

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth()
  const { apiFetch } = useApi()
  const [settings, setSettings] = useState<Settings | null>(null)

  function load() {
    apiFetch('/api/settings')
      .then(r => r.ok ? r.json() : null)
      .then((s: Settings | null) => {
        if (s) {
          setSettings(s)
          if (s.language && s.language !== i18n.language) {
            i18n.changeLanguage(s.language)
          }
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    if (isSignedIn) load()
  }, [isSignedIn])

  return (
    <SettingsContext.Provider value={{ settings, refresh: load }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
