import { Outlet } from 'react-router-dom'
import Sidebar from '../components/landlord/Sidebar'

export default function LandlordLayout() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
