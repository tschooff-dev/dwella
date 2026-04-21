import { useEffect, useState } from 'react'
import StatusPill from '../../components/ui/StatusPill'
import { useApi } from '../../lib/api'

interface Payment {
  id: string
  amount: number
  dueDate: string
  paidDate: string | null
  status: 'PAID' | 'DUE' | 'LATE' | 'PARTIAL'
  method: string | null
  notes: string | null
  tenant: { id: string; firstName: string; lastName: string }
  lease: { id: string; unit: { unitNumber: string; property: { name: string } } }
}

const METHODS = ['Cash', 'Check', 'Bank Transfer', 'Venmo', 'Zelle', 'Other']

function fmt(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function RecordPaymentDrawer({ payment, onClose, onSaved }: { payment: Payment; onClose: () => void; onSaved: (p: Payment) => void }) {
  const { apiFetch } = useApi()
  const [amount, setAmount] = useState(String(payment.amount))
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0])
  const [method, setMethod] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await apiFetch(`/api/payments/${payment.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'PAID', amount: Number(amount), paidDate, method: method || undefined, notes: notes || undefined }),
      })
      if (!res.ok) throw new Error()
      onSaved(await res.json())
    } catch {
      setError('Something went wrong.')
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
            <h2 className="text-base font-semibold text-gray-900">Record Payment</h2>
            <p className="text-xs text-gray-400">{payment.tenant.firstName} {payment.tenant.lastName} · {payment.lease.unit.property.name} {payment.lease.unit.unitNumber}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Amount Received *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
              <input required type="number" min={0} step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="input pl-6" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date Received *</label>
            <input required type="date" value={paidDate} onChange={e => setPaidDate(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
            <select value={method} onChange={e => setMethod(e.target.value)} className="input">
              <option value="">Select…</option>
              {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="e.g. check #1042" className="input resize-none" />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary text-sm flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm flex-1 disabled:opacity-50">{saving ? 'Saving…' : 'Mark as Paid'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PaymentsPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [payments, setPayments] = useState<Payment[] | null>(null)
  const [recording, setRecording] = useState<Payment | null>(null)
  const [generating, setGenerating] = useState(false)
  const { apiFetch } = useApi()

  function load(y: number, m: number) {
    setPayments(null)
    apiFetch(`/api/payments?year=${y}&month=${m}`).then(r => r.json()).then(setPayments)
  }

  useEffect(() => { load(year, month) }, [year, month])

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) } else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) } else setMonth(m => m + 1)
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const expected = (payments ?? []).reduce((s, p) => s + p.amount, 0)
  const collected = (payments ?? []).filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0)
  const outstanding = expected - collected
  const pct = expected > 0 ? Math.round((collected / expected) * 100) : 0

  const sorted = [...(payments ?? [])].sort((a, b) => {
    const order = { LATE: 0, DUE: 1, PARTIAL: 2, PAID: 3 }
    return (order[a.status] ?? 4) - (order[b.status] ?? 4)
  })

  async function handleGenerate() {
    setGenerating(true)
    try {
      await apiFetch('/api/payments/generate', { method: 'POST', body: JSON.stringify({ year, month }) })
      load(year, month)
    } finally {
      setGenerating(false)
    }
  }

  function handleSaved(updated: Payment) {
    setPayments(prev => prev?.map(p => p.id === updated.id ? updated : p) ?? null)
    setRecording(null)
  }

  return (
    <div className="p-7">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500 mt-0.5">Rent ledger · all properties</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-sm font-medium text-gray-900 w-36 text-center">{monthLabel}</span>
          <button onClick={nextMonth} disabled={isCurrentMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* Summary bar */}
      {payments !== null && (
        <div className="card p-5 mb-5">
          {payments.length === 0 ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">No payment records for {monthLabel}.</p>
                {isCurrentMonth && <p className="text-xs text-gray-400 mt-0.5">Generate records from your active leases to start tracking rent.</p>}
              </div>
              {isCurrentMonth && (
                <button onClick={handleGenerate} disabled={generating} className="btn-primary text-sm disabled:opacity-50">
                  {generating ? 'Generating…' : 'Generate This Month\'s Payments'}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide">Expected</div>
                    <div className="text-lg font-bold text-gray-900">${expected.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide">Collected</div>
                    <div className="text-lg font-bold text-green-600">${collected.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide">Outstanding</div>
                    <div className={`text-lg font-bold ${outstanding > 0 ? 'text-red-600' : 'text-gray-400'}`}>${outstanding.toLocaleString()}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{pct}%</div>
                  <div className="text-[10px] text-gray-400">collected</div>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      {payments === null ? (
        <div className="card p-10 text-center text-sm text-gray-400">Loading…</div>
      ) : sorted.length === 0 ? null : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Tenant</th>
                <th className="text-left text-xs font-medium text-gray-400 px-3 py-3">Unit</th>
                <th className="text-right text-xs font-medium text-gray-400 px-3 py-3">Amount</th>
                <th className="text-left text-xs font-medium text-gray-400 px-3 py-3">Due</th>
                <th className="text-left text-xs font-medium text-gray-400 px-3 py-3">Paid</th>
                <th className="text-left text-xs font-medium text-gray-400 px-3 py-3">Method</th>
                <th className="text-left text-xs font-medium text-gray-400 px-3 py-3">Status</th>
                <th className="text-right text-xs font-medium text-gray-400 px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 text-xs font-medium text-gray-900">{p.tenant.firstName} {p.tenant.lastName}</td>
                  <td className="px-3 py-3 text-xs text-gray-500">{p.lease.unit.property.name} · {p.lease.unit.unitNumber}</td>
                  <td className="px-3 py-3 text-xs font-medium text-gray-900 text-right">${p.amount.toLocaleString()}</td>
                  <td className="px-3 py-3 text-xs text-gray-500">{fmt(p.dueDate)}</td>
                  <td className="px-3 py-3 text-xs text-gray-500">{fmt(p.paidDate)}</td>
                  <td className="px-3 py-3 text-xs text-gray-400">{p.method ?? '—'}</td>
                  <td className="px-3 py-3"><StatusPill status={p.status} /></td>
                  <td className="px-5 py-3 text-right">
                    {p.status !== 'PAID' && (
                      <button onClick={() => setRecording(p)} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Record</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {recording && <RecordPaymentDrawer payment={recording} onClose={() => setRecording(null)} onSaved={handleSaved} />}
    </div>
  )
}
