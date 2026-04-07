import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandlordLayout from './layouts/LandlordLayout'
import TenantLayout from './layouts/TenantLayout'
import DashboardPage from './pages/landlord/DashboardPage'
import PropertiesPage from './pages/landlord/PropertiesPage'
import TenantsPage from './pages/landlord/TenantsPage'
import LeasesPage from './pages/landlord/LeasesPage'
import PaymentsPage from './pages/landlord/PaymentsPage'
import ScreeningPage from './pages/landlord/ScreeningPage'
import PortalPage from './pages/tenant/PortalPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root to landlord dashboard for demo */}
        <Route path="/" element={<Navigate to="/landlord/dashboard" replace />} />

        {/* Landlord routes */}
        <Route path="/landlord" element={<LandlordLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="properties" element={<PropertiesPage />} />
          <Route path="tenants" element={<TenantsPage />} />
          <Route path="leases" element={<LeasesPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="screening" element={<ScreeningPage />} />
        </Route>

        {/* Tenant routes */}
        <Route path="/tenant" element={<TenantLayout />}>
          <Route index element={<Navigate to="portal" replace />} />
          <Route path="portal" element={<PortalPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
