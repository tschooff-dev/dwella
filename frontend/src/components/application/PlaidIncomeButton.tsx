import { useCallback, useState } from 'react'
import { usePlaidLink, PlaidLinkOnSuccess } from 'react-plaid-link'

interface PlaidIncomeButtonProps {
  applicationId: string
  onVerified: (data: { employerName: string | null; estimatedMonthlyIncome: number | null }) => void
}

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export default function PlaidIncomeButton({ applicationId, onVerified }: PlaidIncomeButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)

  const fetchLinkToken = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/api/plaid/create-link-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setLinkToken(data.linkToken)
    } catch (err) {
      setError('Failed to initialize income verification. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const onSuccess = useCallback<PlaidLinkOnSuccess>(
    async (publicToken) => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API}/api/plaid/exchange-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applicationId, publicToken }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setVerified(true)
        onVerified({
          employerName: data.employerName,
          estimatedMonthlyIncome: data.estimatedMonthlyIncome,
        })
      } catch (err) {
        setError('Income verification failed. Please try again.')
      } finally {
        setLoading(false)
        setLinkToken(null)
      }
    },
    [applicationId, onVerified]
  )

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit: () => setLinkToken(null),
  })

  if (verified) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-lg">
        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm font-medium text-green-700">Income verified via Plaid</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={linkToken && ready ? () => open() : fetchLinkToken}
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        )}
        {loading ? 'Connecting…' : 'Connect Bank via Plaid'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-[11px] text-gray-400 text-center">
        Securely connect your bank to verify income. Your credentials are never shared with Zenant.
      </p>
    </div>
  )
}
