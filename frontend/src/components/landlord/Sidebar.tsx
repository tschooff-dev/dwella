import { NavLink, useNavigate } from 'react-router-dom'
import { useUser, useClerk } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import { useApi } from '../../lib/api'

const navItems = [
  {
    label: 'Dashboard',
    to: '/landlord/dashboard',
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Properties',
    to: '/landlord/properties',
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    label: 'Tenants',
    to: '/landlord/tenants',
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: 'Leases',
    to: '/landlord/leases',
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: 'Payments',
    to: '/landlord/payments',
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    label: 'Screening',
    to: '/landlord/screening',
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    label: 'Messages',
    to: '/landlord/messages',
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const { user } = useUser()
  const { signOut } = useClerk()
  const { apiFetch } = useApi()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const fetch = () => apiFetch('/api/messages/meta/unread-total').then(r => r.json()).then(d => setUnread(d.count ?? 0)).catch(() => {})
    fetch()
    const interval = setInterval(fetch, 15000)
    return () => clearInterval(interval)
  }, [])

  const displayName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.primaryEmailAddress?.emailAddress : ''
  const email = user?.primaryEmailAddress?.emailAddress ?? ''
  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
            <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900 leading-none">Dwella</div>
            <div className="text-[10px] text-gray-400 leading-none mt-0.5">Property Management</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">Main</div>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <div className="flex items-center gap-2.5">
              {item.icon}
              {item.label}
            </div>
            {item.label === 'Messages' && unread > 0 && (
              <span className="w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shrink-0">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User area */}
      <div className="px-3 py-4 border-t border-gray-50">
<div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-indigo-700">{initials}</span>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-gray-900 truncate">{displayName}</div>
              <div className="text-[10px] text-gray-400 truncate">{email}</div>
            </div>
          </div>
          <button
            onClick={() => signOut(() => navigate('/sign-in'))}
            className="text-[10px] text-gray-400 hover:text-gray-600 shrink-0 ml-2"
            title="Sign out"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
