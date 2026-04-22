import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams, useOutletContext } from 'react-router-dom'
import { useApi } from '../../lib/api'

interface TenantInfo {
  user: { id: string; firstName: string; lastName: string; email: string }
  lease: {
    id: string
    startDate: string
    endDate: string
    rentAmount: number
    depositPaid: number | null
    unit: {
      unitNumber: string
      property: {
        name: string
        address: string
        city: string
        state: string
        zip: string
        landlord: { firstName: string; lastName: string; email: string }
      }
    }
  } | null
}

interface Payment {
  id: string
  amount: number
  status: 'PAID' | 'DUE' | 'LATE' | 'PARTIAL'
  dueDate: string
  paidDate: string | null
  method: string | null
}

interface MaintenanceRequest {
  id: string
  title: string
  description: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  createdAt: string
  unit: { unitNumber: string; property: { name: string } }
}

interface Message {
  id: string
  body: string
  createdAt: string
  sender: { id: string; firstName: string; lastName: string; role: string }
}

function paymentStatusStyle(status: string) {
  if (status === 'PAID') return 'bg-green-100 text-green-700'
  if (status === 'LATE') return 'bg-red-100 text-red-700'
  if (status === 'PARTIAL') return 'bg-amber-100 text-amber-700'
  return 'bg-gray-100 text-gray-600'
}

function priorityStyle(p: string) {
  if (p === 'URGENT') return 'bg-red-100 text-red-700'
  if (p === 'HIGH') return 'bg-orange-100 text-orange-700'
  if (p === 'MEDIUM') return 'bg-amber-100 text-amber-700'
  return 'bg-gray-100 text-gray-600'
}

function maintenanceStatusStyle(s: string) {
  if (s === 'RESOLVED' || s === 'CLOSED') return 'bg-green-100 text-green-700'
  if (s === 'IN_PROGRESS') return 'bg-blue-100 text-blue-700'
  return 'bg-gray-100 text-gray-600'
}

function OverviewTab({ me, payments, onPay, paying }: { me: TenantInfo; payments: Payment[]; onPay: (id: string) => void; paying: string | null }) {
  const lease = me.lease
  const nextDue = payments.find(p => p.status === 'DUE' || p.status === 'LATE')
  const recentPayments = payments.slice(0, 4)

  const leaseEnd = lease ? new Date(lease.endDate) : null
  const daysLeft = leaseEnd ? Math.ceil((leaseEnd.getTime() - Date.now()) / 86400000) : null

  return (
    <div className="space-y-4">
      {lease ? (
        <div className={`rounded-2xl p-5 ${nextDue?.status === 'LATE' ? 'bg-red-50 border border-red-100' : nextDue ? 'bg-indigo-50 border border-indigo-100' : 'bg-green-50 border border-green-100'}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={`text-xs font-semibold tracking-wider uppercase ${nextDue?.status === 'LATE' ? 'text-red-500' : nextDue ? 'text-indigo-500' : 'text-green-600'}`}>
                {nextDue?.status === 'LATE' ? 'Overdue' : nextDue ? 'Rent Due' : 'All Caught Up'}
              </p>
              <p className={`text-3xl font-bold mt-1 ${nextDue?.status === 'LATE' ? 'text-red-700' : nextDue ? 'text-indigo-700' : 'text-green-700'}`}>
                {nextDue ? `$${nextDue.amount.toLocaleString()}` : '$0'}
              </p>
              {nextDue ? (
                <p className={`text-xs mt-1 ${nextDue.status === 'LATE' ? 'text-red-500' : 'text-indigo-500'}`}>
                  Due {new Date(nextDue.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              ) : (
                <p className="text-xs mt-1 text-green-500">No outstanding balance</p>
              )}
            </div>
            {nextDue && (
              <button
                onClick={() => onPay(nextDue.id)}
                disabled={paying === nextDue.id}
                className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                  nextDue.status === 'LATE' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {paying === nextDue.id ? 'Redirecting…' : 'Pay Now'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 text-center text-sm text-gray-400">
          No active lease found. Contact your landlord.
        </div>
      )}

      {lease && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Your Home</p>
          <div className="grid grid-cols-2 gap-y-3 text-xs">
            <span className="text-gray-400">Property</span>
            <span className="text-gray-900 font-medium">{lease.unit.property.name}</span>
            <span className="text-gray-400">Unit</span>
            <span className="text-gray-900 font-medium">#{lease.unit.unitNumber}</span>
            <span className="text-gray-400">Address</span>
            <span className="text-gray-700">{lease.unit.property.address}, {lease.unit.property.city}, {lease.unit.property.state} {lease.unit.property.zip}</span>
            <span className="text-gray-400">Monthly Rent</span>
            <span className="text-gray-900 font-medium">${lease.rentAmount.toLocaleString()}/mo</span>
            <span className="text-gray-400">Lease Period</span>
            <span className={`font-medium ${daysLeft !== null && daysLeft < 60 && daysLeft > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
              {new Date(lease.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {' — '}
              {new Date(lease.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {daysLeft !== null && daysLeft < 60 && daysLeft > 0 && <span className="ml-1 text-amber-500">({daysLeft}d left)</span>}
            </span>
          </div>
        </div>
      )}

      {lease && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Property Manager</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-gray-500">
                {lease.unit.property.landlord.firstName[0]}{lease.unit.property.landlord.lastName[0]}
              </span>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {lease.unit.property.landlord.firstName} {lease.unit.property.landlord.lastName}
              </div>
              <div className="text-xs text-gray-400">{lease.unit.property.landlord.email}</div>
            </div>
          </div>
        </div>
      )}

      {recentPayments.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Payments</p>
          <div className="space-y-3">
            {recentPayments.map(p => (
              <div key={p.id} className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-900 font-medium">
                    {new Date(p.dueDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  {p.paidDate && (
                    <span className="text-gray-400 ml-2">
                      paid {new Date(p.paidDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-700">${p.amount.toLocaleString()}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${paymentStatusStyle(p.status)}`}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PaymentsTab({ payments, onPay, paying, paidId }: { payments: Payment[]; onPay: (id: string) => void; paying: string | null; paidId: string | null }) {
  return (
    <div className="space-y-4">
      {paidId && (
        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-green-700 font-medium">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Payment successful — your balance has been updated.
        </div>
      )}
      {payments.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-400">No payment history yet.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Period</th>
                <th className="text-right text-xs font-medium text-gray-400 px-3 py-3">Amount</th>
                <th className="text-left text-xs font-medium text-gray-400 px-3 py-3 hidden sm:table-cell">Due Date</th>
                <th className="text-left text-xs font-medium text-gray-400 px-3 py-3">Status</th>
                <th className="text-right text-xs font-medium text-gray-400 px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-xs font-medium text-gray-900">
                    {new Date(p.dueDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </td>
                  <td className="px-3 py-3.5 text-xs text-gray-900 text-right font-medium">${p.amount.toLocaleString()}</td>
                  <td className="px-3 py-3.5 text-xs text-gray-500 hidden sm:table-cell">
                    {new Date(p.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-3 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${paymentStatusStyle(p.status)}`}>{p.status}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {(p.status === 'DUE' || p.status === 'LATE' || p.status === 'PARTIAL') && (
                      <button
                        onClick={() => onPay(p.id)}
                        disabled={paying === p.id}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
                      >
                        {paying === p.id ? 'Redirecting…' : 'Pay Now'}
                      </button>
                    )}
                    {p.status === 'PAID' && p.paidDate && (
                      <span className="text-[10px] text-gray-400">
                        {new Date(p.paidDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {p.method && ` · ${p.method}`}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function MaintenanceTab({ requests, onSubmitted }: { requests: MaintenanceRequest[]; onSubmitted: (r: MaintenanceRequest) => void }) {
  const [showDrawer, setShowDrawer] = useState(false)
  const { apiFetch } = useApi()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await apiFetch('/api/tenant/maintenance', {
        method: 'POST',
        body: JSON.stringify({ title, description, priority }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      const request = await res.json()
      onSubmitted(request)
      setShowDrawer(false)
      setTitle('')
      setDescription('')
      setPriority('MEDIUM')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{requests.length} request{requests.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowDrawer(true)} className="btn-primary text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Submit Request
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-400">No maintenance requests yet.</div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{r.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${priorityStyle(r.priority)}`}>{r.priority}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.description}</p>
                  <p className="text-[10px] text-gray-400 mt-1.5">
                    {r.unit.property.name} · Unit {r.unit.unitNumber} · {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${maintenanceStatusStyle(r.status)}`}>
                  {r.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDrawer && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowDrawer(false)} />
          <div className="relative ml-auto w-full max-w-md bg-white h-full shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Submit Maintenance Request</h2>
              <button onClick={() => setShowDrawer(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Issue Title *</label>
                <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Leaky faucet in kitchen" className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
                <textarea required value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the issue in detail…" rows={4} className="input resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value)} className="input">
                  <option value="LOW">Low — Not urgent</option>
                  <option value="MEDIUM">Medium — Normal priority</option>
                  <option value="HIGH">High — Needs attention soon</option>
                  <option value="URGENT">Urgent — Safety or emergency</option>
                </select>
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
            </form>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowDrawer(false)} className="btn-secondary text-sm">Cancel</button>
              <button
                type="button"
                onClick={e => (e.currentTarget.closest('.flex.flex-col')?.querySelector('form') as HTMLFormElement)?.requestSubmit()}
                disabled={saving}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {saving ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MessagesTab({ userId, setUnread }: { userId: string; setUnread: (n: number) => void }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [hasLease, setHasLease] = useState(true)
  const { apiFetch } = useApi()
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await apiFetch('/api/tenant/messages')
      if (res.status === 400) { setHasLease(false); return }
      const data = await res.json()
      if (Array.isArray(data)) {
        setMessages(data)
        setUnread(0)
      }
    } catch {}
  }, [])

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setSending(true)
    try {
      const res = await apiFetch('/api/tenant/messages', {
        method: 'POST',
        body: JSON.stringify({ body: body.trim() }),
      })
      if (res.ok) {
        const msg = await res.json()
        setMessages(prev => [...prev, msg])
        setBody('')
      }
    } finally {
      setSending(false)
    }
  }

  if (!hasLease) {
    return (
      <div className="text-center py-12 text-sm text-gray-400">
        You need an active lease to message your landlord.
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 13rem)' }}>
      <div className="flex-1 overflow-y-auto space-y-3 pb-2">
        {messages.length === 0 && (
          <div className="text-center py-12 text-sm text-gray-400">
            No messages yet. Send your landlord a message below.
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.sender.id === userId
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && (
                  <span className="text-[10px] text-gray-400 px-1">{msg.sender.firstName}</span>
                )}
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? 'bg-indigo-600 text-white rounded-br-md'
                    : 'bg-white border border-gray-100 text-gray-900 rounded-bl-md shadow-sm'
                }`}>
                  {msg.body}
                </div>
                <span className="text-[10px] text-gray-400 px-1">
                  {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="mt-3 flex gap-2">
        <input
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 input"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="btn-primary disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  )
}

export default function PortalPage() {
  const [searchParams] = useSearchParams()
  const tab = searchParams.get('tab') ?? 'overview'
  const paidId = searchParams.get('paid')
  const { setUnread } = useOutletContext<{ setUnread: (n: number) => void }>()
  const { apiFetch } = useApi()

  const [me, setMe] = useState<TenantInfo | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([])
  const [paying, setPaying] = useState<string | null>(null)

  useEffect(() => {
    apiFetch('/api/tenant/me').then(r => r.json()).then(setMe)
    apiFetch('/api/tenant/payments').then(r => r.json()).then(setPayments)
    apiFetch('/api/tenant/maintenance').then(r => r.json()).then(setMaintenance)
  }, [])

  async function handlePay(id: string) {
    setPaying(id)
    try {
      const res = await apiFetch(`/api/tenant/payments/${id}/checkout`, { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setPaying(null)
    } catch {
      setPaying(null)
    }
  }

  if (!me) {
    return <div className="flex items-center justify-center py-20 text-sm text-gray-400">Loading…</div>
  }

  return (
    <div>
      {tab === 'overview' && <OverviewTab me={me} payments={payments} onPay={handlePay} paying={paying} />}
      {tab === 'payments' && <PaymentsTab payments={payments} onPay={handlePay} paying={paying} paidId={paidId} />}
      {tab === 'maintenance' && <MaintenanceTab requests={maintenance} onSubmitted={r => setMaintenance(prev => [r, ...prev])} />}
      {tab === 'messages' && <MessagesTab userId={me.user.id} setUnread={setUnread} />}
    </div>
  )
}
