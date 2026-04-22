import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SignIn, SignUp, useAuth } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import LandlordLayout from './layouts/LandlordLayout'
import TenantLayout from './layouts/TenantLayout'
import DashboardPage from './pages/landlord/DashboardPage'
import PropertiesPage from './pages/landlord/PropertiesPage'
import TenantsPage from './pages/landlord/TenantsPage'
import LeasesPage from './pages/landlord/LeasesPage'
import PaymentsPage from './pages/landlord/PaymentsPage'
import ScreeningPage from './pages/landlord/ScreeningPage'
import MessagesPage from './pages/landlord/MessagesPage'
import PortalPage from './pages/tenant/PortalPage'
import ApplyPage from './pages/tenant/ApplyPage'
import InvitePage from './pages/InvitePage'
import OnboardingPage from './pages/OnboardingPage'
import { useApi } from './lib/api'

function RoleRedirect() {
  const { isSignedIn, isLoaded } = useAuth()
  const { apiFetch } = useApi()
  const [role, setRole] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    apiFetch('/api/users/me')
      .then(r => r.json())
      .then(u => {
        setRole(u?.role && u?.firstName ? u.role : null)
        setChecked(true)
      })
      .catch(() => setChecked(true))
  }, [isLoaded, isSignedIn])

  if (!isLoaded) return null
  if (!isSignedIn) return <Navigate to="/sign-in" replace />
  if (!checked) return null
  if (!role) return <Navigate to="/onboarding" replace />
  if (role === 'TENANT') return <Navigate to="/tenant/portal" replace />
  return <Navigate to="/landlord/dashboard" replace />
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth()
  const { apiFetch } = useApi()
  const [checked, setChecked] = useState(false)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    apiFetch('/api/users/me')
      .then(r => r.json())
      .then(user => {
        setNeedsOnboarding(!user || !user.role || !user.firstName)
        setChecked(true)
      })
      .catch(() => setChecked(true))
  }, [isLoaded, isSignedIn])

  if (!isLoaded) return null
  if (!isSignedIn) return <Navigate to="/sign-in" replace />
  if (!checked) return null
  if (needsOnboarding) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleRedirect />} />

        {/* Auth pages */}
        <Route
          path="/sign-in/*"
          element={<div className="min-h-screen flex items-center justify-center bg-gray-50"><SignIn routing="path" path="/sign-in" afterSignInUrl="/" /></div>}
        />
        <Route
          path="/sign-up/*"
          element={<div className="min-h-screen flex items-center justify-center bg-gray-50"><SignUp routing="path" path="/sign-up" afterSignUpUrl="/" /></div>}
        />

        {/* Onboarding */}
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Landlord routes */}
        <Route path="/landlord" element={<ProtectedRoute><LandlordLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="properties" element={<PropertiesPage />} />
          <Route path="tenants" element={<TenantsPage />} />
          <Route path="leases" element={<LeasesPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="screening" element={<ScreeningPage />} />
          <Route path="messages" element={<MessagesPage />} />
        </Route>

        {/* Tenant routes */}
        <Route path="/tenant" element={<ProtectedRoute><TenantLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="portal" replace />} />
          <Route path="portal" element={<PortalPage />} />
        </Route>

        {/* Public pages */}
        <Route path="/apply/:unitId" element={<ApplyPage />} />
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/invite/:token" element={<InvitePage />} />
      </Routes>
    </BrowserRouter>
  )
}
