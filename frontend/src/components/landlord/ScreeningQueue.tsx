import { useEffect, useState } from 'react'
import { useApi } from '../../lib/api'

interface Application {
  id: string
  applicantName: string
  monthlyIncome: number | null
  creditScore: number | null
  aiScore: number | null
  submittedAt: string
  unit: { unitNumber: string; property: { name: string } }
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 75 ? 'bg-green-500' : score >= 55 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-semibold tabular-nums ${score >= 75 ? 'text-green-700' : score >= 55 ? 'text-amber-700' : 'text-red-700'}`}>
        {score}
      </span>
    </div>
  )
}

function daysAgo(date: string) {
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
}

export default function ScreeningQueue() {
  const [applications, setApplications] = useState<Application[] | null>(null)
  const { apiFetch } = useApi()

  useEffect(() => {
    apiFetch('/api/applications?status=PENDING').then(r => r.json()).then(setApplications)
  }, [])

  if (applications === null) return <div className="py-4 text-center text-sm text-gray-400">Loading…</div>
  if (applications.length === 0) return <div className="py-4 text-center text-sm text-gray-400">No pending applications.</div>

  return (
    <div className="space-y-2">
      {applications.map(app => (
        <div key={app.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-gray-600">
              {app.applicantName.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-medium text-gray-900">{app.applicantName}</span>
              <span className="text-[10px] text-gray-400">{daysAgo(app.submittedAt)}d ago</span>
            </div>
            <div className="text-[10px] text-gray-500 mb-1.5">
              {app.unit.property.name} · Unit {app.unit.unitNumber}
              {app.monthlyIncome ? ` · $${app.monthlyIncome.toLocaleString()}/mo` : ''}
              {app.creditScore ? ` · Credit ${app.creditScore}` : ''}
            </div>
            {app.aiScore !== null && <ScoreBar score={app.aiScore} />}
          </div>
        </div>
      ))}
    </div>
  )
}
