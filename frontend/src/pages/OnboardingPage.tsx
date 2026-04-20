import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useApi } from '../lib/api'

export default function OnboardingPage() {
  const { user } = useUser()
  const navigate = useNavigate()
  const { apiFetch } = useApi()

  const [role, setRole] = useState<'LANDLORD' | 'TENANT' | null>(null)
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!role) return
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch('/api/users/setup', {
        method: 'POST',
        body: JSON.stringify({
          firstName,
          lastName,
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
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">Welcome to Dwella</div>
            <div className="text-xs text-gray-400">Let's set up your account</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">I am a…</label>
            <div className="grid grid-cols-2 gap-3">
              {(['LANDLORD', 'TENANT'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    role === r
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg mb-1">{r === 'LANDLORD' ? '🏠' : '🔑'}</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {r === 'LANDLORD' ? 'Landlord' : 'Tenant'}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {r === 'LANDLORD' ? 'I manage properties' : 'I rent a property'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">First name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Last name</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Phone <span className="text-gray-400">(optional)</span></label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="555-000-0000"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={!role || !firstName || !lastName || loading}
            className="w-full py-2.5 px-4 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Setting up…' : 'Continue to Dwella'}
          </button>
        </form>
      </div>
    </div>
  )
}
