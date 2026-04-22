import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useUser, useClerk } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import { useApi } from '../lib/api'

type Tab = 'overview' | 'payments' | 'maintenance' | 'messages'

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  {
    key: 'overview',
    label: 'Overview',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    key: 'payments',
    label: 'Payments',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  },
  {
    key: 'maintenance',
    label: 'Maintenance',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    key: 'messages',
    label: 'Messages',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  },
]

export default function TenantLayout() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const navigate = useNavigate()
  const { apiFetch } = useApi()
  const [unread, setUnread] = useState(0)

  const displayName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : ''
  const initials = displayName ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'

  useEffect(() => {
    const fetchUnread = () => {
      apiFetch('/api/tenant/messages/unread-count').then(r => r.json()).then(d => setUnread(d.count ?? 0)).catch(() => {})
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-sm font-bold text-gray-900">Dwella</span>
            <span className="text-xs text-gray-400 hidden sm:block">· Resident Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-[10px] font-bold text-indigo-700">{initials}</span>
              </div>
              <span className="text-xs font-medium text-gray-700 hidden sm:block">{displayName}</span>
            </div>
            <button
              onClick={() => signOut(() => navigate('/sign-in'))}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              title="Sign out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab nav */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-0 -mb-px">
            {tabs.map(tab => (
              <NavLink
                key={tab.key}
                to={`/tenant/portal?tab=${tab.key}`}
                className={({ isActive: _isActive }) => {
                  const params = new URLSearchParams(window.location.search)
                  const activeTab = params.get('tab') ?? 'overview'
                  const active = activeTab === tab.key
                  return `flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors relative ${
                    active
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.key === 'messages' && unread > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <Outlet context={{ setUnread }} />
      </main>
    </div>
  )
}
