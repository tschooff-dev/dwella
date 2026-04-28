import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import PlaidIncomeButton from '../../components/application/PlaidIncomeButton'
import StripeIdentityButton from '../../components/application/StripeIdentityButton'
import DocumentUpload from '../../components/application/DocumentUpload'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

type Step = 'info' | 'income' | 'identity' | 'references' | 'documents' | 'consent' | 'submitted'

const STEPS: { key: Step; label: string }[] = [
  { key: 'info', label: 'Basic Info' },
  { key: 'income', label: 'Income' },
  { key: 'identity', label: 'Identity' },
  { key: 'references', label: 'References' },
  { key: 'documents', label: 'Documents' },
  { key: 'consent', label: 'Review' },
]

interface UnitInfo {
  id: string
  unitNumber: string
  bedrooms: number
  bathrooms: number
  squareFeet: number | null
  rentAmount: number
  depositAmount: number | null
  status: string
  property: { name: string; address: string; city: string; state: string }
}

function StepIndicator({ current }: { current: Step }) {
  const currentIndex = STEPS.findIndex(s => s.key === current)
  if (current === 'submitted') return null
  return (
    <div className="flex items-center mb-8 overflow-x-auto pb-1">
      {STEPS.map((step, i) => (
        <div key={step.key} className="flex items-center shrink-0">
          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${
              i < currentIndex ? 'bg-indigo-600 border-indigo-600 text-white'
              : i === currentIndex ? 'border-indigo-600 text-indigo-600 bg-white'
              : 'border-gray-200 text-gray-400 bg-white'
            }`}>
              {i < currentIndex
                ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                : i + 1}
            </div>
            <span className={`text-[10px] mt-1 font-medium whitespace-nowrap ${i <= currentIndex ? 'text-indigo-600' : 'text-gray-400'}`}>{step.label}</span>
          </div>
          {i < STEPS.length - 1 && <div className={`w-10 h-0.5 mb-4 mx-1 shrink-0 ${i < currentIndex ? 'bg-indigo-600' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  )
}

function CheckIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
}

export default function ApplyPage() {
  const { unitId: token } = useParams<{ unitId?: string }>()
  const [unit, setUnit] = useState<UnitInfo | null>(null)
  const [unitError, setUnitError] = useState('')
  const [step, setStep] = useState<Step>('info')
  const [applicationId, setApplicationId] = useState<string | null>(null)

  // Step 1 fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [monthlyIncome, setMonthlyIncome] = useState('')
  const [creditScore, setCreditScore] = useState('')
  const [submittingInfo, setSubmittingInfo] = useState(false)
  const [infoError, setInfoError] = useState('')

  // Step 2 state
  const [incomeVerified, setIncomeVerified] = useState(false)
  const [verifiedIncome, setVerifiedIncome] = useState<{ employer: string | null; amount: number | null }>({ employer: null, amount: null })

  // Step 3 state
  const [identityVerified, setIdentityVerified] = useState(false)

  // Step 4 fields
  const [prevLandlordName, setPrevLandlordName] = useState('')
  const [prevLandlordPhone, setPrevLandlordPhone] = useState('')
  const [savingRefs, setSavingRefs] = useState(false)

  // Step 5 state
  const [docCount, setDocCount] = useState(0)

  // Step 6 fields
  const [ssn, setSsn] = useState('')
  const [ssnConfirm, setSsnConfirm] = useState('')
  const [consentChecked, setConsentChecked] = useState(false)
  const [submittingConsent, setSubmittingConsent] = useState(false)
  const [consentError, setConsentError] = useState('')

  useEffect(() => {
    if (!token) return
    fetch(`${API}/api/applications/token/${token}`)
      .then(r => {
        if (r.status === 410) throw new Error('used')
        if (!r.ok) throw new Error('not_found')
        return r.json()
      })
      .then(setUnit)
      .catch(err => {
        if (err.message === 'used') {
          setUnitError('This application link has already been used. Please request a new one from your landlord.')
        } else {
          setUnitError('Invalid application link. Please check the URL or request a new link from your landlord.')
        }
      })
  }, [token])

  // Step 1: create the application
  async function handleInfoSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setSubmittingInfo(true)
    setInfoError('')
    try {
      const res = await fetch(`${API}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          applicantName: `${firstName} ${lastName}`.trim(),
          applicantEmail: email,
          applicantPhone: phone || undefined,
          monthlyIncome: monthlyIncome ? Number(monthlyIncome) : undefined,
          creditScore: creditScore ? Number(creditScore) : undefined,
        }),
      })
      if (res.status === 410) {
        setInfoError('This application link has already been used. Please request a new one from your landlord.')
        return
      }
      if (!res.ok) throw new Error('Failed to create application')
      const app = await res.json()
      setApplicationId(app.id)
      setStep('income')
    } catch (err: any) {
      setInfoError(err.message?.includes('already been used') ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmittingInfo(false)
    }
  }

  // Step 4: save references
  async function handleRefsSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!applicationId) return
    setSavingRefs(true)
    try {
      await fetch(`${API}/api/applications/${applicationId}/applicant-update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previousLandlordName: prevLandlordName || undefined,
          previousLandlordPhone: prevLandlordPhone || undefined,
        }),
      })
      setStep('documents')
    } finally {
      setSavingRefs(false)
    }
  }

  // Step 6: consent + submit
  async function handleConsentSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!applicationId) return
    if (ssn !== ssnConfirm) { setConsentError('SSNs do not match.'); return }
    if (!consentChecked) { setConsentError('You must authorize the background and credit check.'); return }
    setSubmittingConsent(true)
    setConsentError('')
    try {
      const res = await fetch(`${API}/api/applications/${applicationId}/applicant-update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ssnLastFour: ssn.replace(/\D/g, '').slice(-4),
          backgroundCheckConsent: true,
        }),
      })
      if (!res.ok) throw new Error('Failed to submit')
      setStep('submitted')
    } catch {
      setConsentError('Something went wrong. Please try again.')
    } finally {
      setSubmittingConsent(false)
    }
  }

  const formatSSN = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 9)
    if (digits.length <= 3) return digits
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-sm text-gray-500">No application link provided. Please use a valid link from your landlord.</p>
        </div>
      </div>
    )
  }

  if (unitError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center"><p className="text-sm text-red-600">{unitError}</p></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="text-sm font-bold text-gray-900">Zenant</span>
        </div>

        {step !== 'submitted' && unit && (
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">Apply for Unit {unit.unitNumber}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {unit.property.name} · {unit.property.address}, {unit.property.city}, {unit.property.state} · ${unit.rentAmount.toLocaleString()}/mo
              {unit.bedrooms === 0 ? ' · Studio' : ` · ${unit.bedrooms}bd/${unit.bathrooms}ba`}
              {unit.squareFeet ? ` · ${unit.squareFeet.toLocaleString()} sq ft` : ''}
            </p>
          </div>
        )}

        <StepIndicator current={step} />

        {/* ── SUBMITTED ── */}
        {step === 'submitted' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckIcon className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Application Submitted</h1>
            <p className="text-sm text-gray-500 mb-6">
              Your application for Unit {unit?.unitNumber} at {unit?.property.name} has been received.
              The landlord will review it and contact you within 2–3 business days.
            </p>
            <div className="card p-4 text-left space-y-2 mb-6">
              {incomeVerified && (
                <div className="flex items-center gap-2 text-xs text-green-700"><CheckIcon />Income verified via Plaid</div>
              )}
              {identityVerified && (
                <div className="flex items-center gap-2 text-xs text-green-700"><CheckIcon />Identity submitted to Stripe</div>
              )}
              {(prevLandlordName || prevLandlordPhone) && (
                <div className="flex items-center gap-2 text-xs text-green-700"><CheckIcon />Prior landlord reference included</div>
              )}
              {docCount > 0 && (
                <div className="flex items-center gap-2 text-xs text-green-700"><CheckIcon />{docCount} document{docCount !== 1 ? 's' : ''} uploaded</div>
              )}
              <div className="flex items-center gap-2 text-xs text-green-700"><CheckIcon />Background &amp; credit check authorized</div>
            </div>
          </div>
        )}

        {/* ── STEP 1: Basic Info ── */}
        {step === 'info' && (
          <div className="card p-6">
            <form onSubmit={handleInfoSubmit} className="space-y-4">
              <h2 className="text-sm font-semibold text-gray-900">Basic Information</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                  <input required value={firstName} onChange={e => setFirstName(e.target.value)} className="input" placeholder="Jane" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
                  <input required value={lastName} onChange={e => setLastName(e.target.value)} className="input" placeholder="Smith" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="jane@email.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="input" placeholder="555-000-0000" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Monthly Income</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                    <input type="number" min={0} value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)} className="input pl-6" placeholder="5,000" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Credit Score (approx.)</label>
                  <input type="number" min={300} max={850} value={creditScore} onChange={e => setCreditScore(e.target.value)} className="input" placeholder="700" />
                </div>
              </div>
              {infoError && <p className="text-xs text-red-600">{infoError}</p>}
              <button type="submit" disabled={submittingInfo || !firstName || !lastName || !email} className="btn-primary w-full justify-center disabled:opacity-50">
                {submittingInfo ? 'Creating application…' : 'Continue'}
              </button>
            </form>
          </div>
        )}

        {/* ── STEP 2: Income ── */}
        {step === 'income' && applicationId && (
          <div className="card p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Verify Income</h2>
              <p className="text-xs text-gray-500 mt-1">Connect your payroll or bank account to verify income instantly. No credentials are shared with Zenant.</p>
            </div>

            {incomeVerified && verifiedIncome.amount && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800 space-y-1">
                <div className="font-semibold flex items-center gap-1.5"><CheckIcon />Income verified</div>
                {verifiedIncome.employer && <div>Employer: {verifiedIncome.employer}</div>}
                <div>Monthly income: ${verifiedIncome.amount.toLocaleString()}</div>
              </div>
            )}

            {!incomeVerified && (
              <PlaidIncomeButton applicationId={applicationId} onVerified={data => {
                setIncomeVerified(true)
                setVerifiedIncome({ employer: data.employerName, amount: data.estimatedMonthlyIncome })
              }} />
            )}

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[10px] text-gray-400 font-medium">OR</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            <p className="text-xs text-gray-500 text-center">Upload pay stubs, W-2, or bank statements in the Documents step instead.</p>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setStep('info')} className="btn-secondary flex-1 justify-center text-xs">Back</button>
              <button onClick={() => setStep('identity')} className="btn-primary flex-1 justify-center text-xs">
                {incomeVerified ? 'Continue' : 'Skip for now'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Identity ── */}
        {step === 'identity' && applicationId && (
          <div className="card p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Verify Identity</h2>
              <p className="text-xs text-gray-500 mt-1">
                Take a photo of your government-issued ID and a selfie. Processed securely by Stripe — Zenant never stores your document images.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
              <p className="text-xs font-medium text-gray-700">Accepted documents:</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />Driver's license</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />Passport</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />State-issued ID card</li>
              </ul>
            </div>

            <StripeIdentityButton applicationId={applicationId} onVerified={() => setIdentityVerified(true)} />

            <div className="flex gap-2 pt-1">
              <button onClick={() => setStep('income')} className="btn-secondary flex-1 justify-center text-xs">Back</button>
              <button onClick={() => setStep('references')} className="btn-primary flex-1 justify-center text-xs">
                {identityVerified ? 'Continue' : 'Skip for now'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: References ── */}
        {step === 'references' && applicationId && (
          <div className="card p-6">
            <form onSubmit={handleRefsSubmit} className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Prior Landlord Reference</h2>
                <p className="text-xs text-gray-500 mt-1">Your previous landlord's contact info. We may reach out to verify your rental history.</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Previous Landlord Name</label>
                <input value={prevLandlordName} onChange={e => setPrevLandlordName(e.target.value)} className="input" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Previous Landlord Phone</label>
                <input type="tel" value={prevLandlordPhone} onChange={e => setPrevLandlordPhone(e.target.value)} className="input" placeholder="555-000-0000" />
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setStep('identity')} className="btn-secondary flex-1 justify-center text-xs">Back</button>
                <button type="submit" disabled={savingRefs} className="btn-primary flex-1 justify-center text-xs disabled:opacity-50">
                  {savingRefs ? 'Saving…' : prevLandlordName || prevLandlordPhone ? 'Continue' : 'Skip for now'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── STEP 5: Documents ── */}
        {step === 'documents' && applicationId && (
          <div className="card p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Supporting Documents</h2>
              <p className="text-xs text-gray-500 mt-1">Upload income and identity documents. Files are encrypted and only visible to the landlord reviewing your application.</p>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-700 mb-2">Suggested documents:</p>
              <ul className="text-xs text-gray-500 space-y-1.5">
                {[
                  ['Pay stubs', 'Last 2–3 months', !incomeVerified],
                  ['Bank statements', 'Last 2 months', !incomeVerified],
                  ['W-2 or tax return', 'Most recent year', false],
                  ['Offer letter', 'If starting a new job', false],
                  ['Government-issued ID', 'Front and back', !identityVerified],
                ].map(([name, desc, highlight]) => (
                  <li key={name as string} className="flex items-start gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${highlight ? 'bg-amber-400' : 'bg-gray-300'}`} />
                    <span>
                      <span className={`font-medium ${highlight ? 'text-amber-700' : 'text-gray-700'}`}>{name as string}</span>
                      <span className="text-gray-400"> — {desc as string}</span>
                    </span>
                  </li>
                ))}
              </ul>
              {(!incomeVerified || !identityVerified) && (
                <p className="text-[10px] text-amber-600 mt-3">
                  {[!incomeVerified && 'income', !identityVerified && 'identity'].filter(Boolean).join(' and ')} not verified — uploading documents is especially helpful.
                </p>
              )}
            </div>

            <DocumentUpload
              applicationId={applicationId}
              onUploaded={() => setDocCount(c => c + 1)}
            />

            {docCount > 0 && (
              <p className="text-xs text-green-700 flex items-center gap-1.5"><CheckIcon />{docCount} document{docCount !== 1 ? 's' : ''} uploaded</p>
            )}

            <div className="flex gap-2 pt-1">
              <button onClick={() => setStep('references')} className="btn-secondary flex-1 justify-center text-xs">Back</button>
              <button onClick={() => setStep('consent')} className="btn-primary flex-1 justify-center text-xs">
                {docCount > 0 ? 'Continue' : 'Skip for now'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 6: Consent & Submit ── */}
        {step === 'consent' && applicationId && (
          <div className="card p-6">
            <form onSubmit={handleConsentSubmit} className="space-y-5">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Review &amp; Submit</h2>
                <p className="text-xs text-gray-500 mt-1">Almost done. Review your application and authorize the background and credit check.</p>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2 text-xs">
                <div className="font-semibold text-gray-700 mb-1">Your application includes:</div>
                <div className="flex items-center gap-2 text-gray-600"><CheckIcon className="w-3 h-3 text-green-500 shrink-0" />Personal info — {firstName} {lastName}</div>
                {incomeVerified
                  ? <div className="flex items-center gap-2 text-green-700"><CheckIcon className="w-3 h-3 shrink-0" />Income verified via Plaid</div>
                  : <div className="flex items-center gap-2 text-gray-400"><span className="w-3 h-3 shrink-0 text-center">—</span>Income not Plaid-verified</div>
                }
                {identityVerified
                  ? <div className="flex items-center gap-2 text-green-700"><CheckIcon className="w-3 h-3 shrink-0" />Identity verified via Stripe</div>
                  : <div className="flex items-center gap-2 text-gray-400"><span className="w-3 h-3 shrink-0 text-center">—</span>Identity not Stripe-verified</div>
                }
                {(prevLandlordName || prevLandlordPhone)
                  ? <div className="flex items-center gap-2 text-green-700"><CheckIcon className="w-3 h-3 shrink-0" />Prior landlord reference provided</div>
                  : <div className="flex items-center gap-2 text-gray-400"><span className="w-3 h-3 shrink-0 text-center">—</span>No landlord reference</div>
                }
                {docCount > 0
                  ? <div className="flex items-center gap-2 text-green-700"><CheckIcon className="w-3 h-3 shrink-0" />{docCount} document{docCount !== 1 ? 's' : ''} uploaded</div>
                  : <div className="flex items-center gap-2 text-gray-400"><span className="w-3 h-3 shrink-0 text-center">—</span>No documents uploaded</div>
                }
              </div>

              {/* SSN */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-gray-700">Social Security Number</div>
                <p className="text-xs text-gray-400">Required to run a credit and background check. Only the last 4 digits will be stored.</p>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">SSN *</label>
                  <input
                    required
                    type="password"
                    inputMode="numeric"
                    value={ssn}
                    onChange={e => setSsn(formatSSN(e.target.value))}
                    placeholder="XXX-XX-XXXX"
                    className="input font-mono tracking-widest"
                    maxLength={11}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Confirm SSN *</label>
                  <input
                    required
                    type="password"
                    inputMode="numeric"
                    value={ssnConfirm}
                    onChange={e => setSsnConfirm(formatSSN(e.target.value))}
                    placeholder="XXX-XX-XXXX"
                    className="input font-mono tracking-widest"
                    maxLength={11}
                  />
                </div>
              </div>

              {/* Consent */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={e => setConsentChecked(e.target.checked)}
                  className="mt-0.5 shrink-0"
                />
                <span className="text-xs text-gray-600 leading-relaxed">
                  I authorize {unit?.property.name ?? 'the landlord'} and its agents to obtain a consumer credit report and criminal background check in connection with my rental application. I certify that all information provided is accurate and complete.
                </span>
              </label>

              {consentError && <p className="text-xs text-red-600">{consentError}</p>}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setStep('documents')} className="btn-secondary flex-1 justify-center text-xs">Back</button>
                <button type="submit" disabled={submittingConsent || !consentChecked} className="btn-primary flex-1 justify-center text-xs disabled:opacity-50">
                  {submittingConsent ? 'Submitting…' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        )}

        <p className="text-center text-[11px] text-gray-400 mt-4">
          Powered by Zenant · Your data is encrypted and handled per our privacy policy
        </p>
      </div>
    </div>
  )
}
