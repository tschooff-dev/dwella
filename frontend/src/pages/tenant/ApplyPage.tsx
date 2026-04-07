import { useState } from 'react'
import PlaidIncomeButton from '../../components/application/PlaidIncomeButton'
import StripeIdentityButton from '../../components/application/StripeIdentityButton'
import DocumentUpload from '../../components/application/DocumentUpload'

type Step = 'info' | 'income' | 'identity' | 'documents' | 'submitted'

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  monthlyIncome: string
  creditScore: string
}

// Demo: in production this comes from the URL param (/apply/:unitId)
const DEMO_UNIT = { id: 'unit_3a', number: '3A', property: 'The Elmwood', rent: 1950 }
const DEMO_APPLICATION_ID = 'app_demo_123'
const DEMO_USER_ID = 'user_demo_123'

const steps: { key: Step; label: string }[] = [
  { key: 'info', label: 'Basic Info' },
  { key: 'income', label: 'Income' },
  { key: 'identity', label: 'Identity' },
  { key: 'documents', label: 'Documents' },
]

function StepIndicator({ current }: { current: Step }) {
  const currentIndex = steps.findIndex(s => s.key === current)
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${
              i < currentIndex
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : i === currentIndex
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-gray-200 text-gray-400 bg-white'
            }`}>
              {i < currentIndex ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : i + 1}
            </div>
            <span className={`text-[10px] mt-1 font-medium ${i <= currentIndex ? 'text-indigo-600' : 'text-gray-400'}`}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-16 h-0.5 mb-4 mx-1 ${i < currentIndex ? 'bg-indigo-600' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function ApplyPage() {
  const [step, setStep] = useState<Step>('info')
  const [form, setForm] = useState<FormData>({
    firstName: '', lastName: '', email: '', phone: '',
    monthlyIncome: '', creditScore: '',
  })
  const [incomeVerified, setIncomeVerified] = useState(false)
  const [identityVerified, setIdentityVerified] = useState(false)
  const [verifiedIncome, setVerifiedIncome] = useState<{ employer: string | null; amount: number | null }>({ employer: null, amount: null })

  const field = (key: keyof FormData) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value })),
  })

  if (step === 'submitted') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Application Submitted</h1>
          <p className="text-sm text-gray-500 mb-6">
            Your application for Unit {DEMO_UNIT.number} at {DEMO_UNIT.property} has been received.
            The landlord will review it and contact you within 2–3 business days.
          </p>
          <div className="card p-4 text-left space-y-2 mb-6">
            {incomeVerified && (
              <div className="flex items-center gap-2 text-xs text-green-700">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Income verified via Plaid
              </div>
            )}
            {identityVerified && (
              <div className="flex items-center gap-2 text-xs text-green-700">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Identity submitted to Stripe for verification
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="text-sm font-bold text-gray-900">Dwella</span>
        </div>

        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Apply for Unit {DEMO_UNIT.number}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {DEMO_UNIT.property} · ${DEMO_UNIT.rent.toLocaleString()}/mo
          </p>
        </div>

        <StepIndicator current={step} />

        <div className="card p-6">
          {/* Step 1: Basic Info */}
          {step === 'info' && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-gray-900">Basic Information</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                  <input {...field('firstName')} className="input" placeholder="Jane" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                  <input {...field('lastName')} className="input" placeholder="Smith" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input {...field('email')} type="email" className="input" placeholder="jane@email.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                <input {...field('phone')} type="tel" className="input" placeholder="555-000-0000" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Monthly Income (self-reported)</label>
                  <input {...field('monthlyIncome')} type="number" className="input" placeholder="5000" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Credit Score (approx.)</label>
                  <input {...field('creditScore')} type="number" className="input" placeholder="700" />
                </div>
              </div>
              <button
                onClick={() => setStep('income')}
                disabled={!form.firstName || !form.lastName || !form.email}
                className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Income Verification */}
          {step === 'income' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Verify Income</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Connect your bank account or payroll to verify income automatically.
                  No account numbers or credentials are shared with Dwella.
                </p>
              </div>

              {incomeVerified && verifiedIncome.amount && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800 space-y-1">
                  <div className="font-semibold">✓ Income verified</div>
                  {verifiedIncome.employer && <div>Employer: {verifiedIncome.employer}</div>}
                  <div>Estimated monthly income: ${verifiedIncome.amount.toLocaleString()}</div>
                </div>
              )}

              <PlaidIncomeButton
                applicationId={DEMO_APPLICATION_ID}
                onVerified={(data) => {
                  setIncomeVerified(true)
                  setVerifiedIncome({ employer: data.employerName, amount: data.estimatedMonthlyIncome })
                }}
              />

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[10px] text-gray-400 font-medium">OR</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <p className="text-xs text-gray-500 text-center">
                Upload pay stubs or bank statements in the Documents step instead.
              </p>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setStep('info')} className="btn-secondary flex-1 justify-center text-xs">
                  Back
                </button>
                <button
                  onClick={() => setStep('identity')}
                  className="btn-primary flex-1 justify-center text-xs"
                >
                  {incomeVerified ? 'Continue' : 'Skip for now'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Identity Verification */}
          {step === 'identity' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Verify Identity</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Take a photo of your government-issued ID and a selfie. Processed securely by Stripe
                  — Dwella never stores your document images.
                </p>
              </div>

              <StripeIdentityButton
                applicationId={DEMO_APPLICATION_ID}
                onVerified={() => setIdentityVerified(true)}
              />

              <div className="flex gap-2 pt-2">
                <button onClick={() => setStep('income')} className="btn-secondary flex-1 justify-center text-xs">
                  Back
                </button>
                <button
                  onClick={() => setStep('documents')}
                  className="btn-primary flex-1 justify-center text-xs"
                >
                  {identityVerified ? 'Continue' : 'Skip for now'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Documents */}
          {step === 'documents' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Supporting Documents</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Upload pay stubs, bank statements, or other supporting documents.
                  Files are encrypted and only accessible to the landlord reviewing your application.
                </p>
              </div>

              <div className="space-y-2 text-xs text-gray-600">
                <p className="font-medium">Suggested documents:</p>
                <ul className="list-disc list-inside space-y-0.5 text-gray-500">
                  <li>Last 2 months' pay stubs</li>
                  <li>Last 2 months' bank statements</li>
                  <li>Offer letter (if new job)</li>
                  <li>Tax return or W-2 (self-employed)</li>
                </ul>
              </div>

              <DocumentUpload
                applicationId={DEMO_APPLICATION_ID}
                uploadedById={DEMO_USER_ID}
              />

              <div className="flex gap-2 pt-2">
                <button onClick={() => setStep('identity')} className="btn-secondary flex-1 justify-center text-xs">
                  Back
                </button>
                <button
                  onClick={() => setStep('submitted')}
                  className="btn-primary flex-1 justify-center text-xs"
                >
                  Submit Application
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-4">
          Powered by Dwella · Your data is encrypted and handled per our privacy policy
        </p>
      </div>
    </div>
  )
}
