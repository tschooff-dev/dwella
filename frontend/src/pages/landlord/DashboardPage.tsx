import { useEffect, useState } from 'react'
import MetricCard from '../../components/ui/MetricCard'
import Card from '../../components/ui/Card'
import PaymentTable from '../../components/landlord/PaymentTable'
import ScreeningQueue from '../../components/landlord/ScreeningQueue'
import ExpiringLeases from '../../components/landlord/ExpiringLeases'
import { useApi } from '../../lib/api'

interface Summary {
  totalUnits: number
  occupiedUnits: number
  occupancyRate: number
  rentCollected: number
  outstandingBalance: number
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const { apiFetch } = useApi()

  useEffect(() => {
    apiFetch('/api/payments/meta/summary').then(r => r.json()).then(setSummary)
  }, [])

  const month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const metrics = summary ? [
    { label: 'Total Units', value: String(summary.totalUnits), subtext: `${summary.occupiedUnits} occupied · ${summary.totalUnits - summary.occupiedUnits} vacant`, accent: true },
    { label: 'Occupancy Rate', value: `${summary.occupancyRate}%`, subtext: '' },
    { label: 'Rent Collected', value: `$${summary.rentCollected.toLocaleString()}`, subtext: month },
    { label: 'Outstanding Balance', value: `$${summary.outstandingBalance.toLocaleString()}`, subtext: 'unpaid payments' },
  ] : [
    { label: 'Total Units', value: '—', subtext: '', accent: true },
    { label: 'Occupancy Rate', value: '—', subtext: '' },
    { label: 'Rent Collected', value: '—', subtext: month },
    { label: 'Outstanding Balance', value: '—', subtext: '' },
  ]

  return (
    <div className="p-7">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Here's what's happening.</p>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">{month}</span>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {metrics.map(m => <MetricCard key={m.label} {...m} />)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <Card title="Payment Status" description={`${month} · all units`} noPadding
            actions={<button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">View all</button>}
          >
            <div className="px-5 pb-5 pt-3"><PaymentTable /></div>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card title="AI Screening Queue" description="Pending applicants" noPadding>
            <div className="px-4 pb-4 pt-3"><ScreeningQueue /></div>
          </Card>
          <Card title="Leases Expiring Soon" description="Next 90 days" noPadding>
            <div className="px-4 pb-4 pt-3"><ExpiringLeases /></div>
          </Card>
        </div>
      </div>
    </div>
  )
}
