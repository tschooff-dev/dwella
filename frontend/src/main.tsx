import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import './index.css'
import './lib/i18n'
import { SettingsProvider } from './lib/settings-context'

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!publishableKey) {
  throw new Error('VITE_CLERK_PUBLISHABLE_KEY is not set')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <HelmetProvider>
    <ClerkProvider publishableKey={publishableKey}>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </ClerkProvider>
  </HelmetProvider>
)
