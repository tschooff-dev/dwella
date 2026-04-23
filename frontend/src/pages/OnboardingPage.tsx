import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useApi } from '../lib/api'

export default function OnboardingPage() {
  const { user } = useUser()
  const navigate = useNavigate()
  const { apiFetch } = useApi()

  const [existingRole, setExistingRole] = useState<string | null>(null)
  const [role, setRole] = useState<'LANDLORD' | 'TENANT' | null>(null)
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch('/api/users/me')
      .then(r => r.json())
      .then(u => {
        if (u?.role) {
          setExistingRole(u.role)
          setRole(u.role)
        }
        if (u?.phone) setPhone(u.phone)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!role || !firstName.trim() || !lastName.trim()) return
    setSaving(true)
    setError('')
    try {
      // Update Clerk profile
      await user?.update({ firstName: firstName.trim(), lastName: lastName.trim() })

      // Update DB
      const res = await apiFetch('/api/users/setup', {
        method: 'POST',
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone,
          role,
          email: user?.primaryEmailAddress?.emailAddress ?? '',
        }),
      })
      if (!res.ok) throw new Error('Setup failed')

      navigate(role === 'LANDLORD' ? '/landlord/dashboard' : '/tenant/portal', { replace: true })
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <div style={{ minHeight: '100vh', background: '#f4f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="card" style={{ width: '100%', maxWidth: 440, padding: 36 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <svg width="36" height="36" viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M9 48 L9 24 A17 17 0 0 1 43 24 L43 48 Z M19 48 L19 37 Q19 33 26 33 Q33 33 33 37 L33 48 Z" fill="#4f46e5" />
          </svg>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0d0f18', lineHeight: 1.1 }}>Zenant</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>
              {existingRole ? 'Complete your profile' : 'Set up your account'}
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0d0f18', marginBottom: 6 }}>
          {existingRole ? 'What should we call you?' : 'Welcome to Dwella'}
        </h2>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
          {existingRole
            ? 'Add your name so landlords and teammates know who you are.'
            : "Let's get your account set up in under a minute."}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Role picker — only for new users */}
          {!existingRole && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>I am a…</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {(['LANDLORD', 'TENANT'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    style={{
                      padding: '14px 12px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                      border: `2px solid ${role === r ? '#4f46e5' : '#e6e6ef'}`,
                      background: role === r ? '#eef2ff' : '#fff',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{r === 'LANDLORD' ? '🏠' : '🔑'}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0d0f18' }}>{r === 'LANDLORD' ? 'Landlord' : 'Tenant'}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{r === 'LANDLORD' ? 'I manage properties' : 'I rent a property'}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>First name *</label>
              <input required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane" className="input" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Last name *</label>
              <input required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Smith" className="input" />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Phone <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
            </label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 000-0000" className="input" />
          </div>

          {error && <p style={{ fontSize: 12, color: '#dc2626', margin: 0 }}>{error}</p>}

          <button
            type="submit"
            disabled={!role || !firstName.trim() || !lastName.trim() || saving}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14, opacity: (!role || !firstName.trim() || !lastName.trim() || saving) ? 0.5 : 1 }}
          >
            {saving ? 'Saving…' : 'Continue to Dwella →'}
          </button>
        </form>
      </div>
    </div>
  )
}
