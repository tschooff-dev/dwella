import { useEffect, useState } from 'react'
import StatusPill from '../../components/ui/StatusPill'
import { useApi } from '../../lib/api'

interface Tenant {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  leases: {
    rentAmount: number
    endDate: string
    status: string
    unit: { unitNumber: string; property: { name: string } }
  }[]
  payments: { status: string }[]
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[] | null>(null)
  const [search, setSearch] = useState('')
  const { apiFetch } = useApi()

  useEffect(() => {
    apiFetch('/api/tenants').then(r => r.json()).then(setTenants)
  }, [])

  const filtered = tenants?.filter(t =>
    `${t.firstName} ${t.lastName} ${t.email}`.toLowerCase().includes(search.toLowerCase())
  ) ?? []

  const activeLease = (t: Tenant) => t.leases.find(l => l.status === 'ACTIVE')
  const latestPaymentStatus = (t: Tenant): 'PAID' | 'DUE' | 'LATE' | 'PARTIAL' =>
    (t.payments[0]?.status as any) ?? 'DUE'

  return (
    <div className="p-7">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Tenants</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {tenants === null ? 'Loading…' : `${tenants.length} active tenants`}
          </p>
        </div>
        <div className="relative">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search tenants..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        {tenants === null ? (
          <div className="p-10 text-center text-sm text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">No tenants found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Tenant</th>
                <th className="text-left text-xs font-medium text-gray-400 px-3 py-3">Unit</th>
                <th className="text-right text-xs font-medium text-gray-400 px-3 py-3">Rent</th>
                <th className="text-left text-xs font-medium text-gray-400 px-3 py-3">Lease Ends</th>
                <th className="text-left text-xs font-medium text-gray-400 px-3 py-3">Payment</th>
                <th className="text-right text-xs font-medium text-gray-400 px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(tenant => {
                const lease = activeLease(tenant)
                const unitLabel = lease ? `${lease.unit.property.name} · ${lease.unit.unitNumber}` : '—'
                const leaseEnd = lease ? new Date(lease.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
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
                      <StatusPill status={latestPaymentStatus(tenant)} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">View</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
