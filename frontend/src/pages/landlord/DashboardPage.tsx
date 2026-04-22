import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useApi } from '../../lib/api'
import Avatar from '../../components/ui/Avatar'

interface Summary {
  totalUnits: number
  occupiedUnits: number
  occupancyRate: number
  rentCollected: number
  outstandingBalance: number
}

interface Payment {
  id: string
  amount: number
  dueDate: string
  paidDate: string | null
  status: string
  tenant: { firstName: string; lastName: string }
  lease: { unit: { unitNumber: string; property: { name: string } } }
}

interface MaintenanceItem {
  id: string
  title: string
  priority: string
  status: string
  unit: { unitNumber: string; property: { name: string } }
  tenant: { firstName: string; lastName: string }
  createdAt: string
}

interface Application {
  id: string
  applicantName: string
  unit: { unitNumber: string; property: { name: string } }
  submittedAt: string
}

function payBadge(status: string) {
  const cls =
    status === 'PAID' ? 'badge badge-paid' :
    status === 'LATE' ? 'badge badge-late' :
    status === 'PARTIAL' ? 'badge badge-partial' :
    'badge badge-due'
  return <span className={cls}>{status}</span>
}

function priBadge(priority: string) {
  const cls =
    priority === 'URGENT' ? 'badge badge-urgent' :
    priority === 'HIGH' ? 'badge badge-high' :
    priority === 'LOW' ? 'badge badge-low' :
    'badge badge-medium'
  return <span className={cls}>{priority}</span>
}

function fmt(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function DashboardPage() {
  const { user } = useUser()
  const navigate = useNavigate()
  const { apiFetch } = useApi()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([])
  const [applications, setApplications] = useState<Application[]>([])

  const firstName = user?.firstName ?? 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const month = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  useEffect(() => {
    apiFetch('/api/payments/meta/summary').then(r => r.json()).then(setSummary).catch(() => {})
    apiFetch('/api/payments?year=' + new Date().getFullYear() + '&month=' + (new Date().getMonth() + 1))
      .then(r => r.json()).then(d => Array.isArray(d) && setPayments(d.slice(0, 5))).catch(() => {})
    apiFetch('/api/maintenance').then(r => r.json()).then(d => Array.isArray(d) && setMaintenance(d)).catch(() => {})
    apiFetch('/api/applications').then(r => r.json()).then(d => Array.isArray(d) && setApplications(d.filter((a: Application & { status: string }) => a.status === 'PENDING'))).catch(() => {})
  }, [])

  const openMaint = maintenance.filter(m => m.status === 'OPEN' || m.status === 'IN_PROGRESS')
  const urgentMaint = openMaint.filter(m => m.priority === 'URGENT' || m.priority === 'HIGH').length

  const stats = summary ? [
    {
      label: 'Monthly Revenue',
      value: `$${summary.rentCollected.toLocaleString()}`,
      sub: `${summary.occupiedUnits} active leases`,
      cls: 'stat-indigo',
      icon: (
        <svg width="64" height="64" fill="none" stroke="white" viewBox="0 0 24 24" style={{ opacity: 0.15 }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      label: 'Occupied Units',
      value: `${summary.occupiedUnits}/${summary.totalUnits}`,
      sub: `${summary.totalUnits - summary.occupiedUnits} vacant`,
      cls: 'stat-teal',
      icon: (
        <svg width="64" height="64" fill="none" stroke="white" viewBox="0 0 24 24" style={{ opacity: 0.15 }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      label: 'Open Maintenance',
      value: String(openMaint.length),
      sub: `${urgentMaint} high priority`,
      cls: openMaint.some(m => m.priority === 'URGENT') ? 'stat-amber' : 'stat-green',
      icon: (
        <svg width="64" height="64" fill="none" stroke="white" viewBox="0 0 24 24" style={{ opacity: 0.15 }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: 'Applications',
      value: String(applications.length),
      sub: 'Pending review',
      cls: 'stat-indigo',
      icon: (
        <svg width="64" height="64" fill="none" stroke="white" viewBox="0 0 24 24" style={{ opacity: 0.15 }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
  ] : []

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0d0f18' }}>
          {greeting}, {firstName} 👋
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
          Here's what's happening with your properties today.
        </p>
      </div>

      {/* Stat cards */}
      {stats.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
          {stats.map(s => (
            <div key={s.label} className={s.cls} style={{ borderRadius: 14, padding: '20px 20px 18px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -12, top: -12 }}>{s.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', opacity: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        {/* Recent Payments */}
        <div className="card" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700 }}>Recent Payments</h2>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{month}</p>
            </div>
            <button
              className="btn-ghost"
              style={{ fontSize: 12, padding: '5px 12px' }}
              onClick={() => navigate('/landlord/payments')}
            >
              View all
            </button>
          </div>
          {payments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 13, color: '#9ca3af' }}>
              No payments yet this month.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f0f0f5' }}>
                  {['Tenant', 'Unit', 'Amount', 'Status', 'Date'].map(h => (
                    <th key={h} style={{ textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', paddingBottom: 10, paddingRight: 12, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="row-hover" style={{ borderBottom: '1px solid #f9f9fb', transition: 'background 0.1s' }}>
                    <td style={{ padding: '11px 12px 11px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <Avatar name={`${p.tenant.firstName} ${p.tenant.lastName}`} size={28} />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{p.tenant.firstName} {p.tenant.lastName}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: '#6b7280', paddingRight: 12 }}>
                      {p.lease.unit.property.name} · {p.lease.unit.unitNumber}
                    </td>
                    <td style={{ fontSize: 13, fontWeight: 700, paddingRight: 12 }}>${p.amount.toLocaleString()}</td>
                    <td style={{ paddingRight: 12 }}>{payBadge(p.status)}</td>
                    <td style={{ fontSize: 12, color: '#9ca3af' }}>{fmt(p.paidDate ?? p.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Maintenance alerts */}
          <div className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700 }}>Maintenance</h2>
              <span
                style={{ fontSize: 12, color: '#6366f1', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => navigate('/landlord/maintenance')}
              >
                {openMaint.length} open
              </span>
            </div>
            {openMaint.length === 0 ? (
              <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: '12px 0' }}>All clear ✓</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {openMaint.slice(0, 3).map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: '#fafafa', borderRadius: 8 }}>
                    <div style={{ marginTop: 1 }}>{priBadge(m.priority)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{m.unit.property.name} · Unit {m.unit.unitNumber}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Applications */}
          {applications.length > 0 && (
            <div
              className="card"
              style={{ padding: '20px 22px', background: 'linear-gradient(135deg,#ede9fe,#f0f9ff)', cursor: 'pointer' }}
              onClick={() => navigate('/landlord/screening')}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                New Application
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{applications[0].applicantName}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 14 }}>
                {applications[0].unit.property.name} · Unit {applications[0].unit.unitNumber}
              </div>
              <button className="btn-primary" style={{ fontSize: 12, width: '100%', justifyContent: 'center' }}>
                Review Application
              </button>
            </div>
          )}

          {/* Outstanding balance */}
          {summary && summary.outstandingBalance > 0 && (
            <div className="card" style={{ padding: '20px 22px', borderLeft: '3px solid #f59e0b' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Outstanding
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0d0f18' }}>
                ${summary.outstandingBalance.toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>unpaid this month</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
