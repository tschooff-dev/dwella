import { Outlet } from 'react-router-dom'
import Sidebar from '../components/landlord/Sidebar'

export default function LandlordLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f4f4f8' }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}
