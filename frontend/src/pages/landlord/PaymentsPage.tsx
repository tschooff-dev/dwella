import { useEffect, useState } from 'react'
import { useApi } from '../../lib/api'
import Avatar from '../../components/ui/Avatar'

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

function payBadge(s: string) {
  const cls = s === 'PAID' ? 'badge-paid' : s === 'LATE' ? 'badge-late' : s === 'PARTIAL' ? 'badge-partial' : 'badge-due'
  return <span className={`badge ${cls}`}>{s}</span>
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div className="card" style={{ position: 'relative', marginLeft: 'auto', width: '100%', maxWidth: 420, height: '100%', borderRadius: 0, display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f0f0f5' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Record Payment</h2>
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
              {payment.tenant.firstName} {payment.tenant.lastName} · {payment.lease.unit.property.name} {payment.lease.unit.unitNumber}
            </p>
          </div>
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af' }} onClick={onClose}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Amount Received *</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}>$</span>
              <input required type="number" min={0} step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="input" style={{ paddingLeft: 24 }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Date Received *</label>
            <input required type="date" value={paidDate} onChange={e => setPaidDate(e.target.value)} className="input" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Payment Method</label>
            <select value={method} onChange={e => setMethod(e.target.value)} className="input">
              <option value="">Select…</option>
              {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="e.g. check #1042" className="input" style={{ resize: 'none' }} />
          </div>
          {error && <p style={{ fontSize: 12, color: '#dc2626' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1, justifyContent: 'center', opacity: saving ? 0.5 : 1 }}>
              {saving ? 'Saving…' : 'Mark as Paid'}
            </button>
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
  const [filter, setFilter] = useState<'ALL' | 'PAID' | 'DUE' | 'LATE'>('ALL')
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

  const all = payments ?? []
  const totalCollected = all.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0)
  const totalOutstanding = all.filter(p => p.status !== 'PAID').reduce((s, p) => s + p.amount, 0)
  const collectionRate = totalCollected + totalOutstanding > 0
    ? Math.round(totalCollected / (totalCollected + totalOutstanding) * 100)
    : 0

  const shown = filter === 'ALL'
    ? [...all].sort((a, b) => { const o = { LATE: 0, DUE: 1, PARTIAL: 2, PAID: 3 }; return (o[a.status] ?? 4) - (o[b.status] ?? 4) })
    : all.filter(p => p.status === filter)

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
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Payments</h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Track rent collection across all units</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={prevMonth} style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #e6e6ef', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0d0f18', minWidth: 140, textAlign: 'center' }}>{monthLabel}</span>
          <button onClick={nextMonth} disabled={isCurrentMonth} style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #e6e6ef', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', opacity: isCurrentMonth ? 0.3 : 1 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          {isCurrentMonth && (
            <button onClick={handleGenerate} disabled={generating} className="btn-primary" style={{ marginLeft: 8, opacity: generating ? 0.5 : 1 }}>
              {generating ? 'Generating…' : 'Generate Month'}
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      {payments !== null && all.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: `Collected (${new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short' })})`, value: `$${totalCollected.toLocaleString()}`, color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' },
            { label: 'Outstanding', value: `$${totalOutstanding.toLocaleString()}`, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
            { label: 'Collection Rate', value: `${collectionRate}%`, color: '#4f46e5', bg: '#eff6ff', border: '#bfdbfe' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      {payments !== null && all.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {(['ALL', 'PAID', 'DUE', 'LATE'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 16px', borderRadius: 20, border: '1.5px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                background: filter === f ? '#4f46e5' : 'transparent',
                borderColor: filter === f ? '#4f46e5' : '#e6e6ef',
                color: filter === f ? '#fff' : '#6b7280',
              }}
            >
              {f}{f !== 'ALL' && <span style={{ opacity: 0.7 }}> ({all.filter(p => p.status === f).length})</span>}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      {payments === null ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>Loading…</div>
      ) : all.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#9ca3af' }}>No payments for {monthLabel}.</p>
          {isCurrentMonth && (
            <button onClick={handleGenerate} disabled={generating} className="btn-primary" style={{ marginTop: 16, opacity: generating ? 0.5 : 1 }}>
              {generating ? 'Generating…' : "Generate This Month's Payments"}
            </button>
          )}
        </div>
      ) : shown.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>No {filter.toLowerCase()} payments.</div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f5' }}>
                {['Tenant', 'Unit', 'Period', 'Amount', 'Due', 'Status', 'Paid On', ''].map(h => (
                  <th key={h} className="th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map(p => (
                <tr key={p.id} className="row-hover" style={{ borderBottom: '1px solid #f4f4f8' }}>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <Avatar name={`${p.tenant.firstName} ${p.tenant.lastName}`} size={28} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{p.tenant.firstName} {p.tenant.lastName}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#6b7280' }}>
                    {p.lease.unit.property.name} · {p.lease.unit.unitNumber}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#374151', fontWeight: 500 }}>
                    {new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 700 }}>${p.amount.toLocaleString()}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#6b7280' }}>{fmt(p.dueDate)}</td>
                  <td style={{ padding: '13px 16px' }}>{payBadge(p.status)}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: p.paidDate ? '#059669' : '#ef4444', fontWeight: 500 }}>
                    {fmt(p.paidDate)}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    {p.status !== 'PAID' && (
                      <button onClick={() => setRecording(p)} style={{ fontSize: 12, color: '#4f46e5', fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.textDecoration = 'underline' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.textDecoration = 'none' }}>
                        Record
                      </button>
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
