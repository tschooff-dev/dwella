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
    id: string
    unitNumber: string
    property: { id: string; name: string }
  }
}

interface VacantUnit { id: string; unitNumber: string; rentAmount: number; property: { name: string } }

type Tab = 'PENDING' | 'APPROVED' | 'REJECTED'

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

function ApproveDrawer({ application, onClose, onApproved }: { application: Application; onClose: () => void; onApproved: () => void }) {
  const { apiFetch } = useApi()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [rentAmount, setRentAmount] = useState(application.monthlyIncome ? '' : '')
  const [depositPaid, setDepositPaid] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Pre-fill rent from unit
  useEffect(() => {
    apiFetch(`/api/units/${application.unit.id}`).then(r => r.json()).then(u => {
      if (u.rentAmount) setRentAmount(String(u.rentAmount))
    }).catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      // Create tenant + lease
      const res = await apiFetch('/api/tenants', {
        method: 'POST',
        body: JSON.stringify({
          firstName: application.applicantName.split(' ')[0],
          lastName: application.applicantName.split(' ').slice(1).join(' ') || application.applicantName.split(' ')[0],
          email: application.applicantEmail,
          phone: application.applicantPhone || undefined,
          unitId: application.unit.id,
          startDate,
          endDate,
          rentAmount,
          depositPaid: depositPaid || undefined,
        }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Failed')
      }
      // Mark application approved
      await apiFetch(`/api/applications/${application.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'APPROVED' }) })
      onApproved()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-sm bg-white h-full shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Approve &amp; Create Lease</h2>
            <p className="text-xs text-gray-400">{application.applicantName} · {application.unit.property.name} {application.unit.unitNumber}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 px-6 py-5 space-y-4">
          <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs space-y-1">
            <div className="text-gray-400">Tenant</div>
            <div className="font-medium text-gray-900">{application.applicantName}</div>
            <div className="text-gray-500">{application.applicantEmail}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Lease Start *</label>
              <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Lease End *</label>
              <input required type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Monthly Rent *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                <input required type="number" min={0} value={rentAmount} onChange={e => setRentAmount(e.target.value)} className="input pl-6" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Deposit</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                <input type="number" min={0} value={depositPaid} onChange={e => setDepositPaid(e.target.value)} className="input pl-6" />
              </div>
            </div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary text-sm flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm flex-1 disabled:opacity-50">{saving ? 'Saving…' : 'Approve & Create Lease'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ApplyLinkButton({ units }: { units: VacantUnit[] }) {
  const { apiFetch } = useApi()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [generating, setGenerating] = useState<string | null>(null)

  async function generateAndCopy(unitId: string) {
    setGenerating(unitId)
    try {
      const res = await apiFetch(`/api/units/${unitId}/apply-token`, { method: 'POST' })
      const { url } = await res.json()
      navigator.clipboard.writeText(url)
      setCopied(unitId)
      setTimeout(() => setCopied(null), 2000)
    } finally {
      setGenerating(null)
    }
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="btn-secondary text-sm flex items-center gap-2">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
        Get Apply Link
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-100 rounded-xl shadow-lg py-1 w-72">
            {units.length === 0 ? (
              <p className="text-xs text-gray-400 px-4 py-3">No vacant units available.</p>
            ) : (
              <>
                <p className="text-[10px] text-gray-400 px-4 pt-2.5 pb-1">Each link is single-use — it expires after one application.</p>
                {units.map(u => {
                  const isGenerating = generating === u.id
                  const isCopied = copied === u.id
                  return (
                    <button
                      key={u.id}
                      onClick={() => generateAndCopy(u.id)}
                      disabled={isGenerating}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 text-left disabled:opacity-50"
                    >
                      <div>
                        <div className="text-xs font-medium text-gray-900">{u.property.name} · Unit {u.unitNumber}</div>
                        <div className="text-[10px] text-gray-400">Single-use link</div>
                      </div>
                      <span className={`text-[10px] font-medium shrink-0 ml-2 ${isCopied ? 'text-green-600' : 'text-indigo-600'}`}>
                        {isGenerating ? 'Generating…' : isCopied ? 'Copied!' : 'Copy'}
                      </span>
                    </button>
                  )
                })}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default function ScreeningPage() {
  const { apiFetch } = useApi()
  const [tab, setTab] = useState<Tab>('PENDING')
  const [allApps, setAllApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [approving, setApproving] = useState<Application | null>(null)
  const [vacantUnits, setVacantUnits] = useState<VacantUnit[]>([])

  useEffect(() => {
    Promise.all([
      apiFetch('/api/applications').then(r => r.json()),
      apiFetch('/api/units?status=VACANT').then(r => r.json()),
    ]).then(([apps, units]) => {
      setAllApps(apps)
      setVacantUnits(units)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  async function decline(id: string) {
    setUpdating(id)
    try {
      await apiFetch(`/api/applications/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'REJECTED' }) })
      setAllApps(prev => prev.map(a => a.id === id ? { ...a, status: 'REJECTED' as const } : a))
    } finally {
      setUpdating(null)
    }
  }

  function handleApproved() {
    if (!approving) return
    setAllApps(prev => prev.map(a => a.id === approving.id ? { ...a, status: 'APPROVED' as const } : a))
    setApproving(null)
  }

  const applications = allApps.filter(a => a.status === tab)
  const counts = { PENDING: allApps.filter(a => a.status === 'PENDING').length, APPROVED: allApps.filter(a => a.status === 'APPROVED').length, REJECTED: allApps.filter(a => a.status === 'REJECTED').length }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Screening</h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            {loading ? 'Loading…' : `${counts.PENDING} application${counts.PENDING !== 1 ? 's' : ''} pending review`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ApplyLinkButton units={vacantUnits} />
          <div className="flex items-center gap-2 text-xs bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-lg">
            <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-indigo-700 font-medium">AI Screening Active</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {(['PENDING', 'APPROVED', 'REJECTED'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '6px 16px', borderRadius: 20, border: '1.5px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
              background: tab === t ? '#4f46e5' : 'transparent',
              borderColor: tab === t ? '#4f46e5' : '#e6e6ef',
              color: tab === t ? '#fff' : '#6b7280',
            }}
          >
            {t.charAt(0) + t.slice(1).toLowerCase()}
            {counts[t] > 0 && <span style={{ opacity: 0.7 }}> ({counts[t]})</span>}
          </button>
        ))}
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
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-sm font-medium text-gray-900">No {tab.toLowerCase()} applications</p>
          {tab === 'PENDING' && <p className="text-xs text-gray-400 mt-1">Share an apply link above to start receiving applications.</p>}
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
                        <div className="text-xs text-gray-500 mt-0.5">{app.applicantEmail}{app.applicantPhone ? ` · ${app.applicantPhone}` : ''}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          Applying for: <span className="text-gray-600">Unit {app.unit.unitNumber} · {app.unit.property.name}</span>
                          {' '}· {new Date(app.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
                          <span>AI Score</span><span>{app.aiScore}/100</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${app.aiScore}%` }} />
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
                          <svg className="w-3 h-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide">AI Summary</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{app.aiSummary}</p>
                      </div>
                    )}

                    {tab === 'PENDING' && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => setApproving(app)} disabled={isUpdating} className="btn-primary text-xs px-4 py-1.5 disabled:opacity-50">
                          Approve &amp; Create Lease
                        </button>
                        <button onClick={() => decline(app.id)} disabled={isUpdating} className="px-4 py-1.5 text-xs text-red-600 hover:text-red-700 border border-red-100 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium disabled:opacity-50">
                          {isUpdating ? '…' : 'Decline'}
                        </button>
                      </div>
                    )}

                    {tab === 'APPROVED' && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Approved
                      </span>
                    )}

                    {tab === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-1 rounded-full">Declined</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {approving && <ApproveDrawer application={approving} onClose={() => setApproving(null)} onApproved={handleApproved} />}
    </div>
  )
}
