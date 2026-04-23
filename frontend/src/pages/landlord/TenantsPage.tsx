import { useEffect, useState } from 'react'
import { useApi } from '../../lib/api'
import Avatar from '../../components/ui/Avatar'

interface Lease {
  id: string
  rentAmount: number
  startDate: string
  endDate: string
  status: string
  unit: { unitNumber: string; property: { id: string; name: string } }
  payments: { id: string; amount: number; status: string; dueDate: string }[]
}

interface Tenant {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  leases: Lease[]
  maintenanceRequests?: { id: string; title: string; status: string; createdAt: string; unit: { unitNumber: string; property: { name: string } } }[]
}

interface VacantUnit {
  id: string
  unitNumber: string
  rentAmount: number
  property: { id: string; name: string }
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function payBadge(s: string) {
  const cls = s === 'PAID' ? 'badge-paid' : s === 'LATE' ? 'badge-late' : s === 'PARTIAL' ? 'badge-partial' : 'badge-due'
  return <span className={`badge ${cls}`}>{s}</span>
}

// ─── Add Tenant Drawer ────────────────────────────────────────────────────────

function AddTenantDrawer({ onClose, onCreated }: { onClose: () => void; onCreated: (t: Tenant) => void }) {
  const { apiFetch } = useApi()
  const [units, setUnits] = useState<VacantUnit[]>([])
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [unitId, setUnitId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [rentAmount, setRentAmount] = useState('')
  const [depositPaid, setDepositPaid] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch('/api/units?status=VACANT').then(r => r.json()).then(data => {
      setUnits(data)
      if (data.length === 1) { setUnitId(data[0].id); setRentAmount(String(data[0].rentAmount)) }
    })
  }, [])

  function handleUnitChange(id: string) {
    setUnitId(id)
    const u = units.find(u => u.id === id)
    if (u) setRentAmount(String(u.rentAmount))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await apiFetch('/api/tenants', {
        method: 'POST',
        body: JSON.stringify({ firstName, lastName, email, phone: phone || undefined, unitId, startDate, endDate, rentAmount, depositPaid: depositPaid || undefined }),
      })
      if (!res.ok) { const body = await res.json(); throw new Error(body.error ?? 'Failed to add tenant') }
      const { tenant } = await res.json()
      onCreated(tenant)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div className="card" style={{ position: 'relative', marginLeft: 'auto', width: '100%', maxWidth: 460, height: '100%', borderRadius: 0, display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f0f0f5' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Add Tenant</h2>
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af' }} onClick={onClose}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tenant Info</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>First Name *</label>
              <input required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane" className="input" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Last Name *</label>
              <input required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Smith" className="input" />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email *</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" className="input" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Phone <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="555-000-0000" className="input" />
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 6 }}>Lease Details</div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Unit *</label>
            {units.length === 0 ? (
              <p style={{ fontSize: 12, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px' }}>
                No vacant units available. Add a unit first from Properties.
              </p>
            ) : (
              <select required value={unitId} onChange={e => handleUnitChange(e.target.value)} className="input">
                <option value="">Select a unit…</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.property.name} — Unit {u.unitNumber}</option>)}
              </select>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Lease Start *</label>
              <input required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Lease End *</label>
              <input required type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Monthly Rent *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}>$</span>
                <input required type="number" min={0} value={rentAmount} onChange={e => setRentAmount(e.target.value)} placeholder="1500" className="input" style={{ paddingLeft: 24 }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Deposit Paid</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13 }}>$</span>
                <input type="number" min={0} value={depositPaid} onChange={e => setDepositPaid(e.target.value)} placeholder="1500" className="input" style={{ paddingLeft: 24 }} />
              </div>
            </div>
          </div>
          {error && <p style={{ fontSize: 12, color: '#dc2626' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button type="submit" disabled={saving || units.length === 0} className="btn-primary" style={{ flex: 1, justifyContent: 'center', opacity: saving || units.length === 0 ? 0.5 : 1 }}>
              {saving ? 'Saving…' : 'Add Tenant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Tenant Detail Panel ──────────────────────────────────────────────────────

function TenantDetailPanel({ tenant, onClose, onInvite }: { tenant: Tenant; onClose: () => void; onInvite: () => void }) {
  const activeLease = tenant.leases.find(l => l.status === 'ACTIVE') ?? tenant.leases[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f0f0f5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name={`${tenant.firstName} ${tenant.lastName}`} size={46} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{tenant.firstName} {tenant.lastName}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{tenant.email}</div>
              {tenant.phone && <div style={{ fontSize: 12, color: '#9ca3af' }}>{tenant.phone}</div>}
            </div>
          </div>
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af' }} onClick={onClose}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {activeLease && (
          <div style={{ paddingTop: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['Unit', `${activeLease.unit.property.name} · Unit ${activeLease.unit.unitNumber}`],
              ['Monthly Rent', `$${activeLease.rentAmount.toLocaleString()}`],
              ['Lease End', fmt(activeLease.endDate)],
              ['Payment Status', null],
            ].map(([k, v]) => (
              <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                <span style={{ color: '#9ca3af' }}>{k}</span>
                {v ? <span style={{ fontWeight: 600 }}>{v}</span> : payBadge(activeLease.payments[0]?.status ?? 'DUE')}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }} onClick={onInvite}>
            Send Invite
          </button>
        </div>
      </div>

      {activeLease && activeLease.payments.length > 0 && (
        <div className="card" style={{ padding: '18px 22px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Payment History</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {activeLease.payments.slice(0, 6).map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                <span style={{ color: '#6b7280' }}>
                  {new Date(p.dueDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>${p.amount.toLocaleString()}</span>
                  {payBadge(p.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────

function InviteModal({ tenant, onClose }: { tenant: Tenant; onClose: () => void }) {
  const { apiFetch } = useApi()
  const [link, setLink] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch('/api/invites', { method: 'POST', body: JSON.stringify({ tenantId: tenant.id }) })
      .then(async r => {
        if (!r.ok) { setError((await r.json()).error ?? 'Failed'); return }
        const { token } = await r.json()
        setLink(`${window.location.origin}/invite/${token}`)
      })
      .catch(() => setError('Failed to generate link'))
      .finally(() => setLoading(false))
  }, [])

  function handleCopy() {
    navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div className="card" style={{ position: 'relative', width: '100%', maxWidth: 440, margin: '0 16px', padding: '28px 32px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>Invite {tenant.firstName}</h2>
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Share this link to create their Zenant account</p>
          </div>
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af' }} onClick={onClose}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 13, color: '#9ca3af' }}>Generating link…</div>
        ) : error ? (
          <div style={{ fontSize: 13, color: '#dc2626', textAlign: 'center', padding: '16px 0' }}>{error}</div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fafafa', border: '1px solid #e6e6ef', borderRadius: 8, padding: '10px 14px' }}>
              <span style={{ flex: 1, fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link}</span>
              <button onClick={handleCopy} style={{ fontSize: 12, fontWeight: 600, color: '#4f46e5', background: 'transparent', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8, textAlign: 'center' }}>
              Link expires in 7 days · for {tenant.email}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[] | null>(null)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState<Tenant | null>(null)
  const [inviting, setInviting] = useState<Tenant | null>(null)
  const { apiFetch } = useApi()

  useEffect(() => {
    apiFetch('/api/tenants').then(r => r.json()).then(setTenants)
  }, [])

  function handleTenantAdded(tenant: Tenant) {
    setTenants(prev => prev ? [...prev, tenant].sort((a, b) => a.lastName.localeCompare(b.lastName)) : [tenant])
    setShowAdd(false)
  }

  async function handleSelect(tenant: Tenant) {
    if (selected?.id === tenant.id) { setSelected(null); return }
    const full = await apiFetch(`/api/tenants/${tenant.id}`).then(r => r.json())
    setSelected(full)
  }

  const filtered = (tenants ?? []).filter(t =>
    `${t.firstName} ${t.lastName} ${t.email}`.toLowerCase().includes(search.toLowerCase())
  )

  const activeLease = (t: Tenant) => t.leases.find(l => l.status === 'ACTIVE') ?? t.leases[0]
  const payStatus = (t: Tenant) => activeLease(t)?.payments[0]?.status ?? null

  const daysLeft = (t: Tenant) => {
    const l = activeLease(t)
    if (!l) return null
    return Math.ceil((new Date(l.endDate).getTime() - Date.now()) / 86400000)
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Tenants</h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            {tenants === null ? 'Loading…' : `${tenants.length} active tenant${tenants.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <svg width="14" height="14" fill="none" stroke="#9ca3af" viewBox="0 0 24 24" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search tenants…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input"
              style={{ paddingLeft: 32, width: 200 }}
            />
          </div>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Invite Tenant
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 340px' : '1fr', gap: 20 }}>
        <div className="card" style={{ overflow: 'hidden' }}>
          {tenants === null ? (
            <div style={{ padding: 40, textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>Loading…</div>
          ) : filtered.length === 0 && search ? (
            <div style={{ padding: 40, textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>No tenants match "{search}"</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 12 }}>No tenants yet.</p>
              <button className="btn-primary" onClick={() => setShowAdd(true)}>Add your first tenant</button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f5' }}>
                  {['Tenant', 'Property / Unit', 'Lease Period', 'Rent', 'Status', ''].map(h => (
                    <th key={h} className="th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(tenant => {
                  const lease = activeLease(tenant)
                  const days = daysLeft(tenant)
                  const ps = payStatus(tenant)
                  const isSelected = selected?.id === tenant.id
                  return (
                    <tr
                      key={tenant.id}
                      className="row-hover"
                      style={{ borderBottom: '1px solid #f4f4f8', cursor: 'pointer', background: isSelected ? '#f5f3ff' : '' }}
                      onClick={() => handleSelect(tenant)}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={`${tenant.firstName} ${tenant.lastName}`} size={36} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{tenant.firstName} {tenant.lastName}</div>
                            <div style={{ fontSize: 11, color: '#9ca3af' }}>{tenant.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 12, color: '#6b7280' }}>
                        {lease ? `${lease.unit.property.name} · Unit ${lease.unit.unitNumber}` : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 12, color: days !== null && days < 60 ? '#d97706' : '#6b7280' }}>
                        {lease ? (
                          <>
                            Ends {new Date(lease.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {days !== null && days < 60 && (
                              <span style={{ color: '#f59e0b', fontWeight: 700, marginLeft: 6 }}>{days}d</span>
                            )}
                          </>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700 }}>
                        {lease ? `$${lease.rentAmount.toLocaleString()}` : '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {ps ? payBadge(ps) : <span style={{ fontSize: 12, color: '#d1d5db' }}>—</span>}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={e => { e.stopPropagation(); setInviting(tenant) }}
                          style={{ fontSize: 12, color: '#4f46e5', fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer' }}
                        >
                          Invite
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {selected && (
          <TenantDetailPanel
            tenant={selected}
            onClose={() => setSelected(null)}
            onInvite={() => setInviting(selected)}
          />
        )}
      </div>

      {showAdd && <AddTenantDrawer onClose={() => setShowAdd(false)} onCreated={handleTenantAdded} />}
      {inviting && <InviteModal tenant={inviting} onClose={() => setInviting(null)} />}
    </div>
  )
}
