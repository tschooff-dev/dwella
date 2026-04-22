import { Outlet, useNavigate } from 'react-router-dom'
import { useUser, useClerk } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import { useApi } from '../lib/api'
import Avatar from '../components/ui/Avatar'

type Tab = 'overview' | 'payments' | 'maintenance' | 'messages'

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  {
    key: 'overview',
    label: 'Overview',
    icon: <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  },
  {
    key: 'payments',
    label: 'Payments',
    icon: <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  },
  {
    key: 'maintenance',
    label: 'Maintenance',
    icon: <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    key: 'messages',
    label: 'Messages',
    icon: <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  },
]

export default function TenantLayout() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const navigate = useNavigate()
  const { apiFetch } = useApi()
  const [unread, setUnread] = useState(0)

  const displayName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : ''

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
      {/* Top bar */}
      <header style={{ background: '#0d0f18', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="90" height="23" viewBox="0 0 200 52" xmlns="http://www.w3.org/2000/svg">
              <rect width="52" height="52" rx="13" fill="#4f46e5" />
              <path fillRule="evenodd" d="M9 48 L9 24 A17 17 0 0 1 43 24 L43 48 Z M19 48 L19 37 Q19 33 26 33 Q33 33 33 37 L33 48 Z" fill="white" />
              <text x="66" y="34" fontFamily="'Plus Jakarta Sans', Helvetica Neue, sans-serif" fontSize="24" fontWeight="800" fill="white" letterSpacing="-0.5">Dwella</text>
            </svg>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: 12 }}>Resident Portal</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name={displayName || '?'} size={28} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{displayName}</span>
            <button
              onClick={() => signOut(() => navigate('/sign-in'))}
              title="Sign out"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: '4px 0 4px 8px', marginLeft: 4 }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.35)' }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab nav */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 0 }}>
          {TABS.map(tab => {
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => navigate(`/tenant/portal?tab=${tab.key}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  background: 'transparent', border: 'none',
                  borderBottom: active ? '2px solid #818cf8' : '2px solid transparent',
                  color: active ? '#a5b4fc' : 'rgba(255,255,255,0.45)',
                  transition: 'color 0.1s',
                  position: 'relative',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.75)' }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.45)' }}
              >
                {tab.icon}
                {tab.label}
                {tab.key === 'messages' && unread > 0 && (
                  <div style={{ position: 'absolute', top: 6, right: 8, width: 14, height: 14, borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff', fontWeight: 700 }}>
                    {unread > 9 ? '9+' : unread}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <Outlet context={{ setUnread }} />
      </main>
    </div>
  )
}
