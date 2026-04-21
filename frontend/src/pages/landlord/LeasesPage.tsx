import { useEffect, useState } from 'react'
import StatusPill from '../../components/ui/StatusPill'
import { useApi } from '../../lib/api'

interface Lease {
  id: string
  rentAmount: number
  startDate: string
  endDate: string
  status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'PENDING'
  tenant: { id: string; firstName: string; lastName: string; email: string }
  unit: { id: string; unitNumber: string; property: { id: string; name: string } }
}

interface Tenant { id: string; firstName: string; lastName: string; email: string }
interface VacantUnit { id: string; unitNumber: string; rentAmount: number; property: { name: string } }

type Filter = 'ALL' | 'ACTIVE' | 'EXPIRING' | 'EXPIRED'

function daysLeft(endDate: string) {
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000)
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ExpiryBadge({ days }: { days: number }) {
  if (days < 0) return <span className="text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">Expired</span>
  if (days <= 14) return <span className="text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">{days}d left</span>
  if (days <= 60) return <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">{days}d left</span>
  return <span className="text-[10px] text-gray-400">{days}d left</span>
}

function RenewDrawer({ lease, onClose, onRenewed }: { lease: Lease; onClose: () => void; onRenewed: (l: Lease) => void }) {
  const { apiFetch } = useApi()
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(lease.endDate)
    d.setFullYear(d.getFullYear() + 1)
    return d.toISOString().split('T')[0]
  })
  const [rentAmount, setRentAmount] = useState(String(lease.rentAmount))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await apiFetch(`/api/leases/${lease.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'renew', endDate, rentAmount }),
      })
      if (!res.ok) throw new Error()
      onRenewed(await res.json())
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
            <h2 className="text-base font-semibold text-gray-900">Renew Lease</h2>
            <p className="text-xs text-gray-400">{lease.tenant.firstName} {lease.tenant.lastName} · {lease.unit.property.name} {lease.unit.unitNumber}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">New End Date *</label>
            <input required type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Monthly Rent *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
              <input required type="number" min={0} value={rentAmount} onChange={e => setRentAmount(e.target.value)} className="input pl-6" />
            </div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary text-sm flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm flex-1 disabled:opacity-50">{saving ? 'Saving…' : 'Renew Lease'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function NewLeaseDrawer({ onClose, onCreated }: { onClose: () => void; onCreated: (l: Lease) => void }) {
  const { apiFetch } = useApi()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [units, setUnits] = useState<VacantUnit[]>([])
  const [tenantId, setTenantId] = useState('')
  const [unitId, setUnitId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [rentAmount, setRentAmount] = useState('')
  const [depositPaid, setDepositPaid] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      apiFetch('/api/tenants').then(r => r.json()),
      apiFetch('/api/units?status=VACANT').then(r => r.json()),
    ]).then(([t, u]) => { setTenants(t); setUnits(u) })
  }, [])

  function handleUnitChange(id: string) {
    setUnitId(id)
    const u = units.find(u => u.id === id)
    if (u) setRentAmount(String(u.rentAmount))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await apiFetch('/api/leases', {
        method: 'POST',
        body: JSON.stringify({ unitId, tenantId, startDate, endDate, rentAmount, depositPaid: depositPaid || undefined }),
      })
      if (!res.ok) throw new Error()
      onCreated(await res.json())
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
          <h2 className="text-base font-semibold text-gray-900">New Lease</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tenant *</label>
            <select required value={tenantId} onChange={e => setTenantId(e.target.value)} className="input">
              <option value="">Select tenant…</option>
              {tenants.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName} ({t.email})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Unit *</label>
            {units.length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">No vacant units available.</p>
            ) : (
              <select required value={unitId} onChange={e => handleUnitChange(e.target.value)} className="input">
                <option value="">Select unit…</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.property.name} — Unit {u.unitNumber}</option>)}
              </select>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start *</label>
              <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End *</label>
              <input required type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Rent / mo *</label>
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
            <button type="submit" disabled={saving || units.length === 0} className="btn-primary text-sm flex-1 disabled:opacity-50">{saving ? 'Saving…' : 'Create Lease'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LeasesPage() {
  const [leases, setLeases] = useState<Lease[] | null>(null)
  const [filter, setFilter] = useState<Filter>('ALL')
  const [renewing, setRenewing] = useState<Lease | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [ending, setEnding] = useState<Lease | null>(null)
  const [endingInProgress, setEndingInProgress] = useState(false)
  const { apiFetch } = useApi()

  useEffect(() => {
    apiFetch('/api/leases').then(r => r.json()).then(setLeases)
  }, [])

  async function handleEndLease() {
    if (!ending) return
    setEndingInProgress(true)
    try {
      await apiFetch(`/api/leases/${ending.id}`, { method: 'PATCH', body: JSON.stringify({ action: 'end' }) })
      setLeases(prev => prev?.map(l => l.id === ending.id ? { ...l, status: 'EXPIRED' as const } : l) ?? null)
      setEnding(null)
    } finally {
      setEndingInProgress(false)
    }
  }

  const filtered = (leases ?? []).filter(l => {
    const days = daysLeft(l.endDate)
    if (filter === 'ACTIVE') return l.status === 'ACTIVE' && days > 60
    if (filter === 'EXPIRING') return l.status === 'ACTIVE' && days <= 60
    if (filter === 'EXPIRED') return l.status === 'EXPIRED' || l.status === 'TERMINATED'
    return true
  })

  const expiringSoon = (leases ?? []).filter(l => l.status === 'ACTIVE' && daysLeft(l.endDate) <= 60)
  const active = (leases ?? []).filter(l => l.status === 'ACTIVE')
  const expired = (leases ?? []).filter(l => l.status === 'EXPIRED' || l.status === 'TERMINATED')

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: 'ALL', label: 'All', count: (leases ?? []).length },
    { key: 'ACTIVE', label: 'Active', count: active.filter(l => daysLeft(l.endDate) > 60).length },
    { key: 'EXPIRING', label: 'Expiring Soon', count: expiringSoon.length },
    { key: 'EXPIRED', label: 'Expired', count: expired.length },
  ]

  return (
    <div className="p-7">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Leases</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {leases === null ? 'Loading…' : `${active.length} active · ${expiringSoon.length} expiring within 60 days`}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Lease
        </button>
      </div>

      {/* Expiring soon alert */}
      {expiringSoon.length > 0 && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-xs text-amber-800">
            <span className="font-semibold">{expiringSoon.length} lease{expiringSoon.length !== 1 ? 's' : ''}</span> expiring within 60 days — consider reaching out about renewals.
          </p>
          <button onClick={() => setFilter('EXPIRING')} className="ml-auto text-xs font-medium text-amber-700 hover:text-amber-900 shrink-0">View →</button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
            {t.count > 0 && <span className={`ml-1.5 text-[10px] ${filter === t.key ? 'text-gray-400' : 'text-gray-400'}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {leases === null ? (
          <div className="p-10 text-center text-sm text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">
            {filter === 'ALL' ? 'No leases yet.' : `No ${filter.toLowerCase()} leases.`}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Tenant</th>
                <th className="text-left text-xs font-medium text-gray-400 px-3 py-3">Unit</th>
                <th className="text-right text-xs font-medium text-gray-400 px-3 py-3">Rent</th>
                <th className="text-left text-xs font-medium text-gray-400 px-3 py-3">Start</th>
                <th className="text-left text-xs font-medium text-gray-400 px-3 py-3">End</th>
                <th className="text-left text-xs font-medium text-gray-400 px-3 py-3">Status</th>
                <th className="text-right text-xs font-medium text-gray-400 px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(lease => {
                const days = daysLeft(lease.endDate)
                return (
                  <tr key={lease.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="text-xs font-medium text-gray-900">{lease.tenant.firstName} {lease.tenant.lastName}</div>
                      <div className="text-[10px] text-gray-400">{lease.tenant.email}</div>
                    </td>
                    <td className="px-3 py-3.5 text-xs text-gray-500">{lease.unit.property.name} · {lease.unit.unitNumber}</td>
                    <td className="px-3 py-3.5 text-xs font-medium text-gray-900 text-right">${lease.rentAmount.toLocaleString()}</td>
                    <td className="px-3 py-3.5 text-xs text-gray-500">{fmt(lease.startDate)}</td>
                    <td className="px-3 py-3.5 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        {fmt(lease.endDate)}
                        {lease.status === 'ACTIVE' && <ExpiryBadge days={days} />}
                      </div>
                    </td>
                    <td className="px-3 py-3.5"><StatusPill status={lease.status} /></td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {lease.status === 'ACTIVE' && (
                          <>
                            <button onClick={() => setRenewing(lease)} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Renew</button>
                            <button onClick={() => setEnding(lease)} className="text-xs text-red-500 hover:text-red-700">End</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* End lease confirm */}
      {ending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setEnding(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">End this lease?</h3>
            <p className="text-xs text-gray-500 mb-5">
              This will mark the lease for <strong>{ending.tenant.firstName} {ending.tenant.lastName}</strong> as expired and set Unit {ending.unit.unitNumber} back to vacant.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setEnding(null)} className="btn-secondary text-sm flex-1">Cancel</button>
              <button onClick={handleEndLease} disabled={endingInProgress} className="flex-1 py-2 px-4 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50">
                {endingInProgress ? 'Ending…' : 'End Lease'}
              </button>
            </div>
          </div>
        </div>
      )}

      {renewing && <RenewDrawer lease={renewing} onClose={() => setRenewing(null)} onRenewed={updated => { setLeases(prev => prev?.map(l => l.id === updated.id ? updated : l) ?? null); setRenewing(null) }} />}
      {showNew && <NewLeaseDrawer onClose={() => setShowNew(false)} onCreated={l => { setLeases(prev => prev ? [l, ...prev] : [l]); setShowNew(false) }} />}
    </div>
  )
}
