import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth, useUser, SignIn } from '@clerk/clerk-react'
import { useApi } from '../lib/api'

interface InviteInfo {
  email: string
  landlord: string
  unit: { property: string; address: string; unit: string; rent: number } | null
  acceptedAt: string | null
  expiresAt: string
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const { apiFetch } = useApi()
  const navigate = useNavigate()

  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [error, setError] = useState('')
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [showSignIn, setShowSignIn] = useState(false)

  const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

  useEffect(() => {
    // Store token before sign-up so OnboardingPage can skip the role selector
    if (token) localStorage.setItem('pendingInviteToken', token)

    fetch(`${apiBase}/api/invites/${token}`)
      .then(async r => {
        if (!r.ok) {
          const body = await r.json()
          localStorage.removeItem('pendingInviteToken')
          setError(body.error ?? 'Invite not found')
          return
        }
        return r.json()
      })
      .then(data => data && setInvite(data))
      .catch(() => setError('Failed to load invite'))
  }, [token])

  async function handleAccept() {
    if (!isSignedIn) { setShowSignIn(true); return }
    setAccepting(true)
    try {
      const res = await apiFetch(`/api/invites/${token}/accept`, { method: 'POST' })
      if (!res.ok) {
        const body = await res.json()
        setError(body.error ?? 'Failed to accept invite')
        return
      }
      setAccepted(true)
      setTimeout(() => navigate('/tenant/portal'), 1500)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setAccepting(false)
    }
  }

  if (!isLoaded) return null

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="text-lg font-bold text-gray-900">Zenant</span>
        </div>

        {error ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">Invite Unavailable</h2>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        ) : !invite ? (
          <div className="text-center text-sm text-gray-400">Loading invite…</div>
        ) : accepted ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">Welcome to Zenant!</h2>
            <p className="text-sm text-gray-500">Redirecting to your portal…</p>
          </div>
        ) : showSignIn && !isSignedIn ? (
          <div>
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500">Sign in or create an account to accept your invite</p>
            </div>
            <SignIn
              routing="virtual"
              afterSignInUrl={`/invite/${token}`}
              afterSignUpUrl={`/invite/${token}`}
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-indigo-600 px-6 py-5">
              <p className="text-xs text-indigo-200 font-medium uppercase tracking-wider mb-1">You've been invited</p>
              <h1 className="text-xl font-bold text-white">Join your Zenant portal</h1>
              <p className="text-sm text-indigo-200 mt-1">from {invite.landlord}</p>
            </div>

            <div className="p-6 space-y-4">
              {invite.unit && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Your Home</p>
                  <div className="grid grid-cols-2 gap-y-2 text-xs mt-2">
                    <span className="text-gray-400">Property</span>
                    <span className="text-gray-900 font-medium">{invite.unit.property}</span>
                    <span className="text-gray-400">Unit</span>
                    <span className="text-gray-900 font-medium">#{invite.unit.unit}</span>
                    <span className="text-gray-400">Address</span>
                    <span className="text-gray-700">{invite.unit.address}</span>
                    <span className="text-gray-400">Monthly Rent</span>
                    <span className="text-gray-900 font-medium">${invite.unit.rent.toLocaleString()}/mo</span>
                  </div>
                </div>
              )}

              <div className="bg-amber-50 rounded-xl px-4 py-3 text-xs text-amber-700">
                This invite is for <span className="font-semibold">{invite.email}</span>.
                {isSignedIn && user?.primaryEmailAddress?.emailAddress !== invite.email && (
                  <span className="text-red-600 ml-1">You're signed in with a different email address.</span>
                )}
              </div>

              {isSignedIn ? (
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="w-full btn-primary justify-center text-sm py-3 disabled:opacity-50"
                >
                  {accepting ? 'Accepting…' : 'Access My Portal'}
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => setShowSignIn(true)}
                    className="w-full btn-primary justify-center text-sm py-3"
                  >
                    Create Account
                  </button>
                  <p className="text-xs text-center text-gray-400">
                    Already have an account?{' '}
                    <button onClick={() => setShowSignIn(true)} className="text-indigo-600 hover:underline">Sign in</button>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
