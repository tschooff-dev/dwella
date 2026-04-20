import { useEffect, useState } from 'react'
import { useApi } from '../../lib/api'

interface Application {
  id: string
  applicantName: string
  applicantEmail: string
  applicantPhone: string | null
  monthlyIncome: number | null
  creditScore: number | null
  aiScore: number | null
  aiSummary: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  submittedAt: string
  unit: {
    unitNumber: string
    property: { name: string }
  }
}

function scoreColor(score: number) {
  if (score >= 75) return { bar: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' }
  if (score >= 55) return { bar: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' }
  return { bar: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' }
}

function scoreLabel(score: number) {
  if (score >= 75) return 'Strong'
  if (score >= 55) return 'Moderate'
  return 'Higher Risk'
}

export default function ScreeningPage() {
  const { apiFetch } = useApi()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    apiFetch('/api/applications?status=PENDING')
      .then(r => r.json())
      .then(data => setApplications(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function updateStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    setUpdating(id)
    try {
      await apiFetch(`/api/applications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setApplications(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      console.error(err)
    } finally {
      setUpdating(null)
    }
  }

  const pendingCount = applications.length

  return (
    <div className="p-7">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">AI Tenant Screening</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading…' : `${pendingCount} pending application${pendingCount !== 1 ? 's' : ''} · powered by AI scoring`}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-lg">
          <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-indigo-700 font-medium">AI Screening Active</span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex gap-5">
                <div className="w-11 h-11 rounded-full bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-3xl mb-3">✓</div>
          <p className="text-sm font-medium text-gray-900">No pending applications</p>
          <p className="text-xs text-gray-400 mt-1">New applications will appear here for review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map(app => {
            const score = app.aiScore ?? 0
            const colors = scoreColor(score)
            const initials = app.applicantName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
            const isUpdating = updating === app.id

            return (
              <div key={app.id} className="card p-5">
                <div className="flex items-start gap-5">
                  <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-gray-600">{initials}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{app.applicantName}</h3>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {app.applicantEmail}{app.applicantPhone ? ` · ${app.applicantPhone}` : ''}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          Applying for:{' '}
                          <span className="text-gray-600">
                            Unit {app.unit.unitNumber} · {app.unit.property.name}
                          </span>
                          {' '}· Submitted {new Date(app.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>

                      {app.aiScore != null && (
                        <div className={`shrink-0 flex flex-col items-center px-4 py-2 rounded-xl border ${colors.bg} ${colors.border}`}>
                          <span className={`text-2xl font-bold ${colors.text} leading-none`}>{app.aiScore}</span>
                          <span className={`text-[10px] font-medium ${colors.text} mt-0.5`}>{scoreLabel(app.aiScore)}</span>
                        </div>
                      )}
                    </div>

                    {app.aiScore != null && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                          <span>AI Score</span>
                          <span>{app.aiScore}/100</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${colors.bar} transition-all`} style={{ width: `${app.aiScore}%` }} />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-6 mb-4">
                      {app.monthlyIncome != null && (
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-wide">Monthly Income</div>
                          <div className="text-sm font-semibold text-gray-900">${app.monthlyIncome.toLocaleString()}</div>
                        </div>
                      )}
                      {app.creditScore != null && (
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-wide">Credit Score</div>
                          <div className="text-sm font-semibold text-gray-900">{app.creditScore}</div>
                        </div>
                      )}
                    </div>

                    {app.aiSummary && (
                      <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <svg className="w-3 h-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide">AI Summary</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{app.aiSummary}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateStatus(app.id, 'APPROVED')}
                        disabled={isUpdating}
                        className="btn-primary text-xs px-4 py-1.5 disabled:opacity-50"
                      >
                        {isUpdating ? '…' : 'Approve'}
                      </button>
                      <button
                        onClick={() => updateStatus(app.id, 'REJECTED')}
                        disabled={isUpdating}
                        className="px-4 py-1.5 text-xs text-red-600 hover:text-red-700 border border-red-100 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium disabled:opacity-50"
                      >
                        {isUpdating ? '…' : 'Decline'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
