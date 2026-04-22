import { useEffect, useState } from 'react'
import StatusPill from '../../components/ui/StatusPill'
import { useApi } from '../../lib/api'

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
    apiFetch('/api/units?status=VACANT')
      .then(r => r.json())
      .then(data => {
        setUnits(data)
        if (data.length === 1) {
          setUnitId(data[0].id)
          setRentAmount(String(data[0].rentAmount))
        }
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
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Failed to add tenant')
      }
      const { tenant } = await res.json()
      onCreated(tenant)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-md bg-white h-full shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Add Tenant</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="space-y-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tenant Info</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                <input required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane" className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
                <input required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Smith" className="input" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="555-000-0000" className="input" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lease Details</div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Unit *</label>
              {units.length === 0 ? (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  No vacant units available. Add a unit first from the Properties page.
                </p>
              ) : (
                <select required value={unitId} onChange={e => handleUnitChange(e.target.value)} className="input">
                  <option value="">Select a unit…</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>{u.property.name} — Unit {u.unitNumber}</option>
                  ))}
                </select>
              )}
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
                  <input required type="number" min={0} value={rentAmount} onChange={e => setRentAmount(e.target.value)} placeholder="1500" className="input pl-6" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Deposit Paid</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                  <input type="number" min={0} value={depositPaid} onChange={e => setDepositPaid(e.target.value)} placeholder="1500" className="input pl-6" />
                </div>
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </form>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
          <button
            type="button"
            onClick={e => (e.currentTarget.closest('.flex.flex-col')?.querySelector('form') as HTMLFormElement)?.requestSubmit()}
            disabled={saving || units.length === 0}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Add Tenant'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TenantDetailPanel({ tenant, onClose }: { tenant: Tenant; onClose: () => void }) {
  const activeLease = tenant.leases.find(l => l.status === 'ACTIVE') ?? tenant.leases[0]

  const paymentStatusColor = (status: string) => {
    if (status === 'PAID') return 'text-green-700 bg-green-50'
    if (status === 'LATE') return 'text-red-700 bg-red-50'
    if (status === 'PARTIAL') return 'text-amber-700 bg-amber-50'
    return 'text-gray-600 bg-gray-100'
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-md bg-white h-full shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Tenant Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Identity */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-indigo-700">{tenant.firstName[0]}{tenant.lastName[0]}</span>
            </div>
            <div>
              <div className="text-base font-semibold text-gray-900">{tenant.firstName} {tenant.lastName}</div>
              <div className="text-xs text-gray-500 mt-0.5">{tenant.email}</div>
              {tenant.phone && <div className="text-xs text-gray-500">{tenant.phone}</div>}
            </div>
          </div>

          {/* Active lease */}
          {activeLease && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Active Lease</div>
              <div className="grid grid-cols-2 gap-y-2 text-xs">
                <div className="text-gray-400">Property</div>
                <div className="text-gray-900 font-medium">{activeLease.unit.property.name}</div>
                <div className="text-gray-400">Unit</div>
                <div className="text-gray-900 font-medium">{activeLease.unit.unitNumber}</div>
                <div className="text-gray-400">Rent</div>
                <div className="text-gray-900 font-medium">${activeLease.rentAmount.toLocaleString()}/mo</div>
                <div className="text-gray-400">Start</div>
                <div className="text-gray-900">{new Date(activeLease.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                <div className="text-gray-400">End</div>
                <div className="text-gray-900">{new Date(activeLease.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              </div>
            </div>
          )}

          {/* Payment history */}
          {activeLease && activeLease.payments.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Payment History</div>
              <div className="space-y-1.5">
                {activeLease.payments.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{new Date(p.dueDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 font-medium">${p.amount.toLocaleString()}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${paymentStatusColor(p.status)}`}>{p.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Maintenance requests */}
          {tenant.maintenanceRequests && tenant.maintenanceRequests.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Maintenance Requests</div>
              <div className="space-y-2">
                {tenant.maintenanceRequests.map(m => (
                  <div key={m.id} className="flex items-start justify-between text-xs gap-2">
                    <div>
                      <div className="text-gray-900 font-medium">{m.title}</div>
                      <div className="text-gray-400 mt-0.5">{m.unit.property.name} · Unit {m.unit.unitNumber}</div>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${m.status === 'RESOLVED' ? 'text-green-700 bg-green-50' : 'text-amber-700 bg-amber-50'}`}>
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!activeLease && tenant.leases.length === 0 && (
            <p className="text-xs text-gray-400">No lease history found.</p>
          )}
        </div>
      </div>
    </div>
  )
}

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
        const base = window.location.origin
        setLink(`${base}/invite/${token}`)
      })
      .catch(() => setError('Failed to generate link'))
      .finally(() => setLoading(false))
  }, [])

  function handleCopy() {
    navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Invite {tenant.firstName}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Share this link so they can create their Dwella account</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-6 text-sm text-gray-400">Generating link…</div>
        ) : error ? (
          <div className="text-sm text-red-600 text-center py-4">{error}</div>
        ) : (
          <>
            <div className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-center gap-2 border border-gray-100">
              <span className="flex-1 text-xs text-gray-700 truncate">{link}</span>
              <button
                onClick={handleCopy}
                className="shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-2 text-center">Link expires in 7 days · for {tenant.email}</p>
          </>
        )}
      </div>
    </div>
  )
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[] | null>(null)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [viewing, setViewing] = useState<Tenant | null>(null)
  const [inviting, setInviting] = useState<Tenant | null>(null)
  const { apiFetch } = useApi()

  useEffect(() => {
    apiFetch('/api/tenants').then(r => r.json()).then(setTenants)
  }, [])

  function handleTenantAdded(tenant: Tenant) {
    setTenants(prev => prev ? [...prev, tenant].sort((a, b) => a.lastName.localeCompare(b.lastName)) : [tenant])
    setShowAdd(false)
  }

  async function handleViewTenant(tenant: Tenant) {
    // Fetch full detail (includes maintenance requests)
    const full = await apiFetch(`/api/tenants/${tenant.id}`).then(r => r.json())
    setViewing(full)
  }

  const filtered = tenants?.filter(t =>
    `${t.firstName} ${t.lastName} ${t.email}`.toLowerCase().includes(search.toLowerCase())
  ) ?? []

  const activeLease = (t: Tenant) => t.leases.find(l => l.status === 'ACTIVE') ?? t.leases[0]
  const latestPaymentStatus = (t: Tenant) => activeLease(t)?.payments[0]?.status ?? null

  return (
    <div className="p-7">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Tenants</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {tenants === null ? 'Loading…' : `${tenants.length} tenant${tenants.length !== 1 ? 's' : ''} across your properties`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search tenants…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Tenant
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {tenants === null ? (
          <div className="p-10 text-center text-sm text-gray-400">Loading…</div>
        ) : filtered.length === 0 && search ? (
          <div className="p-10 text-center text-sm text-gray-400">No tenants match "{search}"</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-gray-400 mb-3">No tenants yet.</p>
            <button className="btn-primary text-sm" onClick={() => setShowAdd(true)}>Add your first tenant</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Tenant</th>
                <th className="text-left text-xs font-medium text-gray-400 px-3 py-3">Unit</th>
                <th className="text-right text-xs font-medium text-gray-400 px-3 py-3">Rent</th>
                <th className="text-left text-xs font-medium text-gray-400 px-3 py-3">Lease Ends</th>
                <th className="text-left text-xs font-medium text-gray-400 px-3 py-3">Payment</th>
                <th className="text-right text-xs font-medium text-gray-400 px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(tenant => {
                const lease = activeLease(tenant)
                const unitLabel = lease ? `${lease.unit.property.name} · ${lease.unit.unitNumber}` : '—'
                const leaseEnd = lease ? new Date(lease.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
                const pmtStatus = latestPaymentStatus(tenant)
                return (
                  <tr key={tenant.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-indigo-600">
                            {tenant.firstName[0]}{tenant.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-900">{tenant.firstName} {tenant.lastName}</div>
                          <div className="text-[10px] text-gray-400">{tenant.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-xs text-gray-500">{unitLabel}</td>
                    <td className="px-3 py-3.5 text-xs font-medium text-gray-900 text-right">
                      {lease ? `$${lease.rentAmount.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-3 py-3.5 text-xs text-gray-500">{leaseEnd}</td>
                    <td className="px-3 py-3.5">
                      {pmtStatus ? <StatusPill status={pmtStatus as any} /> : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => setInviting(tenant)}
                          className="text-xs text-gray-400 hover:text-gray-600 font-medium"
                          title="Send portal invite"
                        >
                          Invite
                        </button>
                        <button
                          onClick={() => handleViewTenant(tenant)}
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && <AddTenantDrawer onClose={() => setShowAdd(false)} onCreated={handleTenantAdded} />}
      {viewing && <TenantDetailPanel tenant={viewing} onClose={() => setViewing(null)} />}
      {inviting && <InviteModal tenant={inviting} onClose={() => setInviting(null)} />}
    </div>
  )
}
