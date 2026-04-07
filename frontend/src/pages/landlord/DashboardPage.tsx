import MetricCard from '../../components/ui/MetricCard'
import Card from '../../components/ui/Card'
import PaymentTable from '../../components/landlord/PaymentTable'
import ScreeningQueue from '../../components/landlord/ScreeningQueue'
import ExpiringLeases from '../../components/landlord/ExpiringLeases'

const metrics = [
  { label: 'Total Units', value: '12', subtext: '10 occupied · 2 vacant', accent: true },
  { label: 'Occupancy Rate', value: '83%', subtext: 'vs 78% last month' },
  { label: 'Rent Collected', value: '$14,750', subtext: 'April 2025' },
  { label: 'Outstanding Balance', value: '$10,900', subtext: '3 tenants overdue' },
]

export default function DashboardPage() {
  return (
    <div className="p-7">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back, Marcus. Here's what's happening.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">April 2025</span>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {metrics.map(m => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Payment table — spans 2 cols */}
        <div className="xl:col-span-2">
          <Card
            title="Payment Status"
            description="April 2025 — all units"
            noPadding
            actions={
              <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">View all</button>
            }
          >
            <div className="px-5 pb-5 pt-3">
              <PaymentTable />
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          <Card
            title="AI Screening Queue"
            description="4 pending applicants"
            noPadding
            actions={
              <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">4 new</span>
            }
          >
            <div className="px-4 pb-4 pt-3">
              <ScreeningQueue />
            </div>
          </Card>

          <Card
            title="Leases Expiring Soon"
            description="Next 90 days"
            noPadding
          >
            <div className="px-4 pb-4 pt-3">
              <ExpiringLeases />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
