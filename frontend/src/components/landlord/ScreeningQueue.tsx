interface Applicant {
  id: string
  name: string
  unit: string
  property: string
  score: number
  income: number
  creditScore: number
  submittedDaysAgo: number
}

const applicants: Applicant[] = [
  { id: '1', name: 'Derek Walsh', unit: '202', property: 'Riverside Commons', score: 95, income: 9500, creditScore: 782, submittedDaysAgo: 1 },
  { id: '2', name: 'Jordan Bell', unit: '3A', property: 'The Elmwood', score: 88, income: 7200, creditScore: 748, submittedDaysAgo: 2 },
  { id: '3', name: 'Asha Patel', unit: '3A', property: 'The Elmwood', score: 67, income: 5100, creditScore: 691, submittedDaysAgo: 3 },
  { id: '4', name: 'Keisha Monroe', unit: '202', property: 'Riverside Commons', score: 48, income: 4200, creditScore: 630, submittedDaysAgo: 3 },
]

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

export default function ScreeningQueue() {
  return (
    <div className="space-y-2">
      {applicants.map(applicant => (
        <div key={applicant.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-gray-600">
              {applicant.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-medium text-gray-900">{applicant.name}</span>
              <span className="text-[10px] text-gray-400">{applicant.submittedDaysAgo}d ago</span>
            </div>
            <div className="text-[10px] text-gray-500 mb-1.5">
              {applicant.property} · Unit {applicant.unit} · ${applicant.income.toLocaleString()}/mo · Credit {applicant.creditScore}
            </div>
            <ScoreBar score={applicant.score} />
          </div>
        </div>
      ))}
    </div>
  )
}
