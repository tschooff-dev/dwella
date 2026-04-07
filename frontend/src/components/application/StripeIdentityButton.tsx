import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '')
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

interface StripeIdentityButtonProps {
  applicationId: string
  onVerified: () => void
}

export default function StripeIdentityButton({ applicationId, onVerified }: StripeIdentityButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)

  const handleVerify = async () => {
    setLoading(true)
    setError(null)

    try {
      // 1. Create a verification session on our backend
      const res = await fetch(`${API}/api/identity/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // 2. Load Stripe and open the Identity modal
      const stripe = await stripePromise
      if (!stripe) throw new Error('Stripe failed to load')

      const { error: stripeError } = await stripe.verifyIdentity(data.clientSecret)

      if (stripeError) {
        if (stripeError.code === 'session_cancelled') {
          // User closed the modal — not an error
          return
        }
        throw new Error(stripeError.message)
      }

      // Session submitted — final result arrives via webhook
      // Optimistically update the UI; the webhook will confirm
      setVerified(true)
      onVerified()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Identity verification failed')
    } finally {
      setLoading(false)
    }
  }

  if (verified) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-lg">
        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm font-medium text-green-700">Identity submitted — verification in progress</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleVerify}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
      >
        {loading ? (
          <svg className="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
          </svg>
        )}
        {loading ? 'Opening verification…' : 'Verify Identity with Stripe'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-[11px] text-gray-400 text-center">
        Government-issued ID + selfie. Processed securely by Stripe — Dwella never sees your document.
      </p>
    </div>
  )
}
