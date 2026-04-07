interface Applicant {
  id: string
  name: string
  email: string
  phone: string
  unit: string
  property: string
  income: number
  creditScore: number
  aiScore: number
  aiSummary: string
  submittedDate: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

const applicants: Applicant[] = [
  {
    id: '1',
    name: 'Derek Walsh',
    email: 'derek.walsh@email.com',
    phone: '555-300-0003',
    unit: '202',
    property: 'Riverside Commons',
    income: 9500,
    creditScore: 782,
    aiScore: 95,
    aiSummary: 'Derek Walsh reports income of $9,500/mo and a credit score of 782. Exceptional applicant — top-tier credit and strong income well above the 3x rent threshold. Low risk, highly recommended. No red flags detected in the application.',
    submittedDate: 'Apr 6, 2025',
    status: 'PENDING',
  },
  {
    id: '2',
    name: 'Jordan Bell',
    email: 'jordan.bell@email.com',
    phone: '555-300-0001',
    unit: '3A',
    property: 'The Elmwood',
    income: 7200,
    creditScore: 748,
    aiScore: 88,
    aiSummary: 'Jordan Bell reports income of $7,200/mo and a credit score of 748. Strong applicant with excellent credit and income well above the 3x rent threshold. Low risk profile. Previous rental history not provided — recommend requesting references.',
    submittedDate: 'Apr 5, 2025',
    status: 'PENDING',
  },
  {
    id: '3',
    name: 'Asha Patel',
    email: 'asha.patel@email.com',
    phone: '555-300-0002',
    unit: '3A',
    property: 'The Elmwood',
    income: 5100,
    creditScore: 691,
    aiScore: 67,
    aiSummary: 'Asha Patel reports income of $5,100/mo and a credit score of 691. Moderate applicant — income meets the 3x threshold but credit score is below the preferred 720 range. Recommend verifying employment, requesting 2 months of bank statements, and checking rental references.',
    submittedDate: 'Apr 4, 2025',
    status: 'PENDING',
  },
  {
    id: '4',
    name: 'Keisha Monroe',
    email: 'keisha.monroe@email.com',
    phone: '555-300-0004',
    unit: '202',
    property: 'Riverside Commons',
    income: 4200,
    creditScore: 630,
    aiScore: 48,
    aiSummary: 'Keisha Monroe reports income of $4,200/mo and a credit score of 630. Higher-risk applicant — income is slightly below the preferred 3x threshold for this unit ($3,400 × 3 = $10,200) and credit score is below average. If proceeding, recommend requiring a co-signer or increased security deposit.',
    submittedDate: 'Apr 4, 2025',
    status: 'PENDING',
  },
]

function scoreColor(score: number) {
  if (score >= 75) return { bar: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' }
  if (score >= 55) return { bar: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' }
  return { bar: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' }
}

function scoreLabel(score: number) {
  if (score >= 75) return 'Strong'
  if (score >= 55) return 'Moderate'
  return 'Higher Risk'
}

export default function ScreeningPage() {
  return (
    <div className="p-7">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">AI Tenant Screening</h1>
          <p className="text-sm text-gray-500 mt-0.5">4 pending applications · powered by AI scoring</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-lg">
          <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-indigo-700 font-medium">AI Screening Active</span>
        </div>
      </div>

      <div className="space-y-4">
        {applicants.map(applicant => {
          const colors = scoreColor(applicant.aiScore)
          return (
            <div key={applicant.id} className="card p-5">
              <div className="flex items-start gap-5">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-gray-600">
                    {applicant.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{applicant.name}</h3>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {applicant.email} · {applicant.phone}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Applying for: <span className="text-gray-600">Unit {applicant.unit} · {applicant.property}</span>
                        {' '}· Submitted {applicant.submittedDate}
                      </div>
                    </div>

                    {/* Score badge */}
                    <div className={`shrink-0 flex flex-col items-center px-4 py-2 rounded-xl border ${colors.bg} ${colors.border}`}>
                      <span className={`text-2xl font-bold ${colors.text} leading-none`}>{applicant.aiScore}</span>
                      <span className={`text-[10px] font-medium ${colors.text} mt-0.5`}>{scoreLabel(applicant.aiScore)}</span>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                      <span>AI Score</span>
                      <span>{applicant.aiScore}/100</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colors.bar} transition-all`}
                        style={{ width: `${applicant.aiScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-6 mb-4">
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wide">Monthly Income</div>
                      <div className="text-sm font-semibold text-gray-900">${applicant.income.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wide">Credit Score</div>
                      <div className="text-sm font-semibold text-gray-900">{applicant.creditScore}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wide">Income Ratio</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {(applicant.income / 3400).toFixed(1)}x
                      </div>
                    </div>
                  </div>

                  {/* AI Summary */}
                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <svg className="w-3 h-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide">AI Summary</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{applicant.aiSummary}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button className="btn-primary text-xs px-4 py-1.5">
                      Approve
                    </button>
                    <button className="btn-secondary text-xs px-4 py-1.5">
                      Request More Info
                    </button>
                    <button className="px-4 py-1.5 text-xs text-red-600 hover:text-red-700 border border-red-100 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium">
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
