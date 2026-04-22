import { Outlet, useNavigate } from 'react-router-dom'
import { useUser, useClerk } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import { useApi } from '../lib/api'
import Avatar from '../components/ui/Avatar'

type Tab = 'overview' | 'payments' | 'maintenance' | 'messages'

const TABS: { key: Tab; label: string; icon: string }[] = [
  {
    key: 'overview',
    label: 'Overview',
    icon: 'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9',
  },
  {
    key: 'payments',
    label: 'Payments',
    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  },
  {
    key: 'maintenance',
    label: 'Maintenance',
    icon: 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z',
  },
  {
    key: 'messages',
    label: 'Messages',
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  },
]

export default function TenantLayout() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const navigate = useNavigate()
  const { apiFetch } = useApi()
  const [unread, setUnread] = useState(0)

  const displayName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : ''
  const firstName = user?.firstName ?? ''
  const lastName = user?.lastName ?? ''

  const params = new URLSearchParams(window.location.search)
  const activeTab = (params.get('tab') as Tab) ?? 'overview'

  useEffect(() => {
    const fetchUnread = () => {
      apiFetch('/api/tenant/messages/unread-count').then(r => r.json()).then(d => setUnread(d.count ?? 0)).catch(() => {})
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#f4f4f8' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e6e6ef', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px' }}>
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M3 21 L3 11 A9 9 0 0 1 21 11 L21 21 Z M9.5 21 L9.5 15.5 Q9.5 14 12 14 Q14.5 14 14.5 15.5 L14.5 21 Z" fill="white" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0d0f18', lineHeight: 1.1 }}>Dwella</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.04em' }}>Resident Portal</div>
              </div>
            </div>

            {/* User */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar name={displayName || '?'} size={32} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{displayName}</span>
              <button
                onClick={() => signOut(() => navigate('/sign-in'))}
                title="Sign out"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#c4c4d0', padding: '4px 0 4px 6px', marginLeft: 2 }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6b7280' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#c4c4d0' }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, marginBottom: -1 }}>
            {TABS.map(tab => {
              const active = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => navigate(`/tenant/portal?tab=${tab.key}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '12px 16px',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: active ? 700 : 500,
                    color: active ? '#4f46e5' : '#6b7280',
                    borderBottom: active ? '2px solid #4f46e5' : '2px solid transparent',
                    transition: 'all 0.15s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#374151' }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#6b7280' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={tab.icon} />
                  </svg>
                  {tab.label}
                  {tab.key === 'messages' && unread > 0 && !active && (
                    <span style={{ background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 10, padding: '1px 5px', minWidth: 16, textAlign: 'center' }}>
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
        <Outlet context={{ setUnread, firstName, lastName }} />
      </main>
    </div>
  )
}
