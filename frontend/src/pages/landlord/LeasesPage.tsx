import { useEffect, useState } from 'react'
import StatusPill from '../../components/ui/StatusPill'
import { useApi } from '../../lib/api'

interface Lease {
  id: string
  rentAmount: number
  startDate: string
  endDate: string
  status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'PENDING'
  tenant: { firstName: string; lastName: string }
  unit: { unitNumber: string; property: { name: string } }
}

function daysLeft(endDate: string) {
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000)
}

function daysLeftBadge(days: number) {
  if (days <= 14) return <span className="text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">{days}d left</span>
  if (days <= 60) return <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">{days}d left</span>
  return <span className="text-[10px] text-gray-400">{days}d left</span>
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function LeasesPage() {
  const [leases, setLeases] = useState<Lease[] | null>(null)
  const { apiFetch } = useApi()

  useEffect(() => {
    apiFetch('/api/leases').then(r => r.json()).then(setLeases)
  }, [])

  const active = leases?.filter(l => l.status === 'ACTIVE') ?? []
  const expiringSoon = active.filter(l => daysLeft(l.endDate) <= 90).length

  return (
    <div className="p-7">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Leases</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {leases === null ? 'Loading…' : `${active.length} active · ${expiringSoon} expiring within 90 days`}
          </p>
        </div>
        <button className="btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Lease
        </button>
      </div>

      <div className="card overflow-hidden">
        {leases === null ? (
          <div className="p-10 text-center text-sm text-gray-400">Loading…</div>
        ) : leases.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">No leases yet.</div>
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
                <th className="text-right text-xs font-medium text-gray-400 px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leases.map(lease => (
                <tr key={lease.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-xs font-medium text-gray-900">
                    {lease.tenant.firstName} {lease.tenant.lastName}
                  </td>
                  <td className="px-3 py-3.5 text-xs text-gray-500">
                    {lease.unit.property.name} · {lease.unit.unitNumber}
                  </td>
                  <td className="px-3 py-3.5 text-xs font-medium text-gray-900 text-right">
                    ${lease.rentAmount.toLocaleString()}
                  </td>
                  <td className="px-3 py-3.5 text-xs text-gray-500">{fmt(lease.startDate)}</td>
                  <td className="px-3 py-3.5 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      {fmt(lease.endDate)}
                      {lease.status === 'ACTIVE' && daysLeftBadge(daysLeft(lease.endDate))}
                    </div>
                  </td>
                  <td className="px-3 py-3.5"><StatusPill status={lease.status} /></td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="text-xs text-gray-500 hover:text-gray-700">View</button>
                      <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Renew</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
