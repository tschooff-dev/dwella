import { useEffect, useState } from 'react'
import { useApi } from '../../lib/api'
import Avatar from '../../components/ui/Avatar'

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

function DaysLeftBadge({ days }: { days: number }) {
  if (days < 0) return <span className="badge badge-late">Expired</span>
  if (days <= 14) return <span className="badge badge-late">{days}d left</span>
  if (days <= 60) return <span className="badge badge-due">{days}d left</span>
  return <span style={{ fontSize: 12, color: '#9ca3af' }}>{days}d</span>
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div className="card" style={{ position: 'relative', marginLeft: 'auto', width: '100%', maxWidth: 420, height: '100%', borderRadius: 0, display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f0f0f5' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Renew Lease</h2>
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{lease.tenant.firstName} {lease.tenant.lastName} · {lease.unit.property.name} {lease.unit.unitNumber}</p>
          </div>
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af' }} onClick={onClose}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>New End Date *</label>
            <input required type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Monthly Rent *</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}>$</span>
              <input required type="number" min={0} value={rentAmount} onChange={e => setRentAmount(e.target.value)} className="input" style={{ paddingLeft: 24 }} />
            </div>
          </div>
          {error && <p style={{ fontSize: 12, color: '#dc2626' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1, justifyContent: 'center', opacity: saving ? 0.5 : 1 }}>{saving ? 'Saving…' : 'Renew Lease'}</button>
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div className="card" style={{ position: 'relative', marginLeft: 'auto', width: '100%', maxWidth: 420, height: '100%', borderRadius: 0, display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f0f0f5' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>New Lease</h2>
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af' }} onClick={onClose}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Tenant *</label>
            <select required value={tenantId} onChange={e => setTenantId(e.target.value)} className="input">
              <option value="">Select tenant…</option>
              {tenants.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName} ({t.email})</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Unit *</label>
            {units.length === 0 ? (
              <p style={{ fontSize: 12, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px' }}>No vacant units available.</p>
            ) : (
              <select required value={unitId} onChange={e => handleUnitChange(e.target.value)} className="input">
                <option value="">Select unit…</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.property.name} — Unit {u.unitNumber}</option>)}
              </select>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Start *</label>
              <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>End *</label>
              <input required type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Rent / mo *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}>$</span>
                <input required type="number" min={0} value={rentAmount} onChange={e => setRentAmount(e.target.value)} className="input" style={{ paddingLeft: 24 }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Deposit</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}>$</span>
                <input type="number" min={0} value={depositPaid} onChange={e => setDepositPaid(e.target.value)} className="input" style={{ paddingLeft: 24 }} />
              </div>
            </div>
          </div>
          {error && <p style={{ fontSize: 12, color: '#dc2626' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button type="submit" disabled={saving || units.length === 0} className="btn-primary" style={{ flex: 1, justifyContent: 'center', opacity: saving || units.length === 0 ? 0.5 : 1 }}>
              {saving ? 'Saving…' : 'Create Lease'}
            </button>
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

  const all = leases ?? []
  const active = all.filter(l => l.status === 'ACTIVE')
  const expiringSoon = active.filter(l => daysLeft(l.endDate) <= 60)
  const expired = all.filter(l => l.status === 'EXPIRED' || l.status === 'TERMINATED')

  const filtered = all.filter(l => {
    const days = daysLeft(l.endDate)
    if (filter === 'ACTIVE') return l.status === 'ACTIVE' && days > 60
    if (filter === 'EXPIRING') return l.status === 'ACTIVE' && days <= 60
    if (filter === 'EXPIRED') return l.status === 'EXPIRED' || l.status === 'TERMINATED'
    return true
  })

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: 'ALL', label: 'All', count: all.length },
    { key: 'ACTIVE', label: 'Active', count: active.filter(l => daysLeft(l.endDate) > 60).length },
    { key: 'EXPIRING', label: 'Expiring Soon', count: expiringSoon.length },
    { key: 'EXPIRED', label: 'Expired', count: expired.length },
  ]

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Leases</h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            {leases === null ? 'Loading…' : `${active.length} active · ${expiringSoon.length} expiring within 60 days`}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Lease
        </button>
      </div>

      {/* Expiring alert */}
      {expiringSoon.length > 0 && (
        <div style={{ marginBottom: 20, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="15" height="15" fill="none" stroke="#f59e0b" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
          <p style={{ fontSize: 12, color: '#92400e' }}>
            <strong>{expiringSoon.length} lease{expiringSoon.length !== 1 ? 's' : ''}</strong> expiring within 60 days — consider reaching out about renewals.
          </p>
          <button onClick={() => setFilter('EXPIRING')} style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: '#b45309', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            View →
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)} style={{
            padding: '6px 16px', borderRadius: 20, border: '1.5px solid', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
            background: filter === t.key ? '#4f46e5' : 'transparent',
            borderColor: filter === t.key ? '#4f46e5' : '#e6e6ef',
            color: filter === t.key ? '#fff' : '#6b7280',
          }}>
            {t.label}{t.count > 0 && <span style={{ opacity: 0.7 }}> ({t.count})</span>}
          </button>
        ))}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {leases === null ? (
          <div style={{ padding: 40, textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>
            {filter === 'ALL' ? 'No leases yet.' : `No ${filter.toLowerCase()} leases.`}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f5' }}>
                {['Tenant', 'Property', 'Unit', 'Monthly Rent', 'Lease End', 'Days Left', ''].map(h => (
                  <th key={h} className="th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(lease => {
                const days = daysLeft(lease.endDate)
                return (
                  <tr key={lease.id} className="row-hover" style={{ borderBottom: '1px solid #f4f4f8' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <Avatar name={`${lease.tenant.firstName} ${lease.tenant.lastName}`} size={30} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{lease.tenant.firstName} {lease.tenant.lastName}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{lease.tenant.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: '#6b7280' }}>{lease.unit.property.name}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600 }}>Unit {lease.unit.unitNumber}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700 }}>${lease.rentAmount.toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: '#374151' }}>{fmt(lease.endDate)}</td>
                    <td style={{ padding: '14px 16px' }}><DaysLeftBadge days={days} /></td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {lease.status === 'ACTIVE' && (
                          <>
                            <button onClick={() => setRenewing(lease)} style={{ fontSize: 12, color: '#4f46e5', fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer' }}>Renew</button>
                            <button onClick={() => setEnding(lease)} style={{ fontSize: 12, color: '#ef4444', fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer' }}>End</button>
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setEnding(null)} />
          <div className="card" style={{ position: 'relative', width: '100%', maxWidth: 400, margin: '0 16px', padding: '28px 32px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>End this lease?</h3>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
              This will mark the lease for <strong>{ending.tenant.firstName} {ending.tenant.lastName}</strong> as expired and set Unit {ending.unit.unitNumber} back to vacant.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEnding(null)} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button onClick={handleEndLease} disabled={endingInProgress} style={{ flex: 1, padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: endingInProgress ? 0.5 : 1 }}>
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
