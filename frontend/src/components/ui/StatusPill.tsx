import { PaymentStatus, UnitStatus, ApplicationStatus, LeaseStatus } from '../../types'

type AnyStatus = PaymentStatus | UnitStatus | ApplicationStatus | LeaseStatus | string

const statusConfig: Record<string, { className: string; label?: string }> = {
  PAID: { className: 'status-paid', label: 'Paid' },
  DUE: { className: 'status-due', label: 'Due' },
  LATE: { className: 'status-late', label: 'Late' },
  PARTIAL: { className: 'status-due', label: 'Partial' },
  OCCUPIED: { className: 'bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', label: 'Occupied' },
  VACANT: { className: 'status-vacant', label: 'Vacant' },
  MAINTENANCE: { className: 'bg-orange-50 text-orange-700 border border-orange-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', label: 'Maintenance' },
  ACTIVE: { className: 'bg-green-50 text-green-700 border border-green-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', label: 'Active' },
  EXPIRED: { className: 'status-late', label: 'Expired' },
  TERMINATED: { className: 'bg-gray-100 text-gray-600 border border-gray-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', label: 'Terminated' },
  PENDING: { className: 'status-due', label: 'Pending' },
  APPROVED: { className: 'status-paid', label: 'Approved' },
  REJECTED: { className: 'status-late', label: 'Rejected' },
  WITHDRAWN: { className: 'status-vacant', label: 'Withdrawn' },
}

interface StatusPillProps {
  status: AnyStatus
  label?: string
}

export default function StatusPill({ status, label }: StatusPillProps) {
  const config = statusConfig[status] ?? { className: 'status-vacant', label: status }
  const displayLabel = label ?? config.label ?? status

  return (
    <span className={config.className.includes('inline-flex') ? config.className : `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {displayLabel}
    </span>
  )
}
