import { SignIn, SignUp } from '@clerk/clerk-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

// ── Shared data ───────────────────────────────────────────────────────────────

const STATS = [
  { label: 'Properties Managed', value: '12,400+' },
  { label: 'Rent Collected (2025)', value: '$48M' },
  { label: 'Average Response Time', value: '< 2 hrs' },
]

const TESTIMONIAL = {
  quote: "Zenant completely changed how I manage my properties. Everything from payments to maintenance is finally in one place.",
  name: "Marcus T.",
  role: "Landlord · 6 properties",
  initials: "MT",
}

// ── Clerk appearance — desktop ────────────────────────────────────────────────

const clerkAppearance = {
  variables: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    colorPrimary: '#4f46e5',
    colorBackground: '#ffffff',
    colorInputBackground: '#ffffff',
    colorInputText: '#0d0f18',
    colorText: '#0d0f18',
    colorTextSecondary: '#9ca3af',
    colorNeutral: '#0d0f18',
    borderRadius: '9px',
    spacingUnit: '18px',
  },
  elements: {
    card: {
      background: '#ffffff',
      border: '1px solid #e6e6ef',
      borderRadius: '16px',
      padding: '32px 28px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
      width: '100%',
    },
    headerTitle: { fontSize: '20px', fontWeight: '800', color: '#0d0f18', letterSpacing: '-0.02em' },
    headerSubtitle: { fontSize: '13px', color: '#9ca3af' },
    socialButtonsBlockButton: {
      background: '#ffffff', border: '1.5px solid #e6e6ef', borderRadius: '10px',
      fontSize: '13px', fontWeight: '600', color: '#0d0f18',
    },
    dividerLine: { background: '#f0f0f5' },
    dividerText: { fontSize: '11px', color: '#c4c4d0', fontWeight: '600' },
    formFieldLabel: { fontSize: '12px', fontWeight: '600', color: '#374151' },
    formFieldInput: {
      border: '1.5px solid #e6e6ef', borderRadius: '9px', padding: '11px 14px',
      fontSize: '13px', color: '#0d0f18', fontFamily: "'Plus Jakarta Sans', sans-serif",
    },
    formButtonPrimary: {
      background: '#0d0f18', borderRadius: '9px', fontSize: '13px', fontWeight: '700', padding: '12px',
    },
    footerActionLink: { color: '#4f46e5', fontWeight: '700' },
    identityPreviewText: { color: '#0d0f18' },
    formResendCodeLink: { color: '#4f46e5' },
    otpCodeFieldInput: { border: '1.5px solid #e6e6ef', borderRadius: '9px', fontSize: '18px', fontWeight: '700' },
  },
}

// ── Clerk appearance — mobile ─────────────────────────────────────────────────

const clerkAppearanceMobile = {
  variables: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    colorPrimary: '#4f46e5',
    colorBackground: '#ffffff',
    colorInputBackground: '#fafafa',
    colorInputText: '#0d0f18',
    colorText: '#0d0f18',
    colorTextSecondary: '#9ca3af',
    colorNeutral: '#0d0f18',
    borderRadius: '10px',
    spacingUnit: '18px',
  },
  elements: {
    rootBox: { width: '100%' },
    card: {
      background: '#ffffff', border: '1px solid #e6e6ef', borderRadius: '20px',
      padding: '28px 22px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: '100%', margin: 0,
    },
    headerTitle: { fontSize: '20px', fontWeight: '800', color: '#0d0f18', letterSpacing: '-0.02em' },
    headerSubtitle: { fontSize: '13px', color: '#9ca3af' },
    socialButtonsBlockButton: {
      background: '#ffffff', border: '1.5px solid #e6e6ef', borderRadius: '12px',
      padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: '#0d0f18',
    },
    dividerLine: { background: '#f0f0f5' },
    dividerText: { fontSize: '11px', color: '#c4c4d0', fontWeight: '600' },
    formFieldLabel: { fontSize: '12px', fontWeight: '600', color: '#374151' },
    formFieldInput: {
      border: '1.5px solid #e6e6ef', borderRadius: '10px', padding: '13px 14px',
      fontSize: '14px', color: '#0d0f18', background: '#fafafa',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    },
    formButtonPrimary: {
      background: '#0d0f18', borderRadius: '12px', fontSize: '14px', fontWeight: '700', padding: '14px',
    },
    footerActionLink: { color: '#4f46e5', fontWeight: '700' },
    identityPreviewText: { color: '#0d0f18' },
    formResendCodeLink: { color: '#4f46e5' },
    otpCodeFieldInput: { border: '1.5px solid #e6e6ef', borderRadius: '10px', fontSize: '20px', fontWeight: '700' },
  },
}

// ── Shared SVG pieces ─────────────────────────────────────────────────────────

function ArchMark({ size = 36, color = '#4f46e5' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size * 1.05} viewBox="0 0 44 46">
      <path fillRule="evenodd"
        d="M4 44 L4 20 A18 18 0 0 1 40 20 L40 44 Z M14 44 L14 32 Q14 28 22 28 Q30 28 30 32 L30 44 Z"
        fill={color}
      />
      <rect x="0" y="44" width="44" height="2" rx="1" fill={color} opacity="0.3" />
    </svg>
  )
}

function ArchRings() {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
      {[320, 520, 720, 920, 1120].map((r, i) => (
        <g key={r} transform="translate(200, 120)">
          <path
            fillRule="evenodd"
            d={`M${-r * 0.45} ${r * 0.5} L${-r * 0.45} 0 A${r * 0.45} ${r * 0.45} 0 0 1 ${r * 0.45} 0 L${r * 0.45} ${r * 0.5} Z M${-r * 0.18} ${r * 0.5} L${-r * 0.18} ${r * 0.2} A${r * 0.18} ${r * 0.18} 0 0 1 ${r * 0.18} ${r * 0.2} L${r * 0.18} ${r * 0.5} Z`}
            fill="none" stroke="rgba(255,255,255,0.07)"
            strokeWidth={i === 0 ? 2 : 1.5} opacity={1 - i * 0.15}
          />
        </g>
      ))}
    </svg>
  )
}

// ── Desktop: Left panel ───────────────────────────────────────────────────────

function LeftPanel() {
  return (
    <div style={{
      flex: 1, position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(160deg, #1e1b4b 0%, #0d0f18 55%, #0c1a2e 100%)',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      padding: '48px 56px',
    }}>
      <ArchRings />
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />
      <div style={{
        position: 'absolute', top: -120, left: -80, width: 520, height: 520, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,70,229,0.25) 0%, transparent 70%)', pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
        <ArchMark size={34} color="#fff" />
        <span style={{ fontSize: 25, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>Zenant</span>
      </div>

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 460 }}>
        <div style={{
          display: 'inline-block', background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.3)',
          borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600,
          color: '#a5b4fc', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 22,
        }}>Property Management, Simplified</div>

        <h1 style={{ fontSize: 44, fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 18 }}>
          The easier way<br />
          <span style={{ color: '#818cf8' }}>to manage</span> your<br />
          rental properties.
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 40 }}>
          Payments, maintenance, leases, and tenant<br />communication — all in one place.
        </p>

        <div style={{ display: 'flex', gap: 36, marginBottom: 48 }}>
          {STATS.map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginTop: 3, lineHeight: 1.4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '20px 22px' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 14 }}>
            "{TESTIMONIAL.quote}"
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(79,70,229,0.4)', border: '1.5px solid rgba(129,140,248,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#a5b4fc',
            }}>{TESTIMONIAL.initials}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{TESTIMONIAL.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{TESTIMONIAL.role}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 2, fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 500 }}>
        © 2026 Zenant · Secure · Private · Encrypted
      </div>
    </div>
  )
}

// ── Desktop: Right panel ──────────────────────────────────────────────────────

function RightPanel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: 520, flexShrink: 0, background: '#f4f4f8',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '48px 40px', position: 'relative',
    }}>
      <div style={{ position: 'absolute', top: 32, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ArchMark size={18} color="#4f46e5" />
          <span style={{ fontSize: 15, fontWeight: 800, color: '#0d0f18', letterSpacing: '-0.02em' }}>Zenant</span>
        </div>
      </div>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {children}
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#c4c4d0' }}>
          Secured by Clerk · <span style={{ color: '#9ca3af' }}>Privacy Policy</span>
        </div>
      </div>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 4,
        background: 'linear-gradient(90deg, #4f46e5, #7c3aed, #0891b2)',
      }} />
    </div>
  )
}

// ── Mobile: Splash screen ─────────────────────────────────────────────────────

function MobileSplash({ onGetStarted, onSignIn }: { onGetStarted: () => void; onSignIn: () => void }) {
  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(160deg, #1e1b4b 0%, #0d0f18 55%, #0c1a2e 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
        backgroundSize: '36px 36px',
      }} />
      <div style={{ position: 'absolute', top: -80, left: -60, width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <svg style={{ position: 'absolute', top: -20, left: -20, width: 320, height: 320, opacity: 0.12 }} viewBox="0 0 320 320">
        {[80, 140, 200, 260].map(r => (
          <path key={r} fillRule="evenodd"
            d={`M${160 - r * 0.55} ${r * 0.6 + 60} L${160 - r * 0.55} ${160 - r * 0.2} A${r * 0.55} ${r * 0.55} 0 0 1 ${160 + r * 0.55} ${160 - r * 0.2} L${160 + r * 0.55} ${r * 0.6 + 60} Z M${160 - r * 0.22} ${r * 0.6 + 60} L${160 - r * 0.22} ${160 + r * 0.05} A${r * 0.22} ${r * 0.22} 0 0 1 ${160 + r * 0.22} ${160 + r * 0.05} L${160 + r * 0.22} ${r * 0.6 + 60} Z`}
            fill="none" stroke="white" strokeWidth="1.5"
          />
        ))}
      </svg>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '52px 28px 40px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ArchMark size={32} color="#818cf8" />
          <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>Zenant</span>
        </div>

        <div>
          <div style={{
            display: 'inline-block', background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.3)',
            borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700,
            color: '#a5b4fc', letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: 18,
          }}>Property Management</div>
          <h1 style={{ fontSize: 34, fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 16 }}>
            Managing your<br />
            <span style={{ color: '#818cf8' }}>property</span><br />
            made simple.
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
            Payments, maintenance, leases and communication — all in one place.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={onGetStarted} style={{
            background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 14,
            padding: '16px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 20px rgba(79,70,229,0.4)',
          }}>Get Started</button>
          <button onClick={onSignIn} style={{
            background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14,
            padding: '16px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>Sign In</button>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>
            Secured by Clerk · Encrypted
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Mobile: Form screen ───────────────────────────────────────────────────────

function MobileForm({ onBack, mode, children }: { onBack: () => void; mode: 'signin' | 'signup'; children: React.ReactNode }) {
  const heading = mode === 'signup' ? 'Welcome to Zenant' : 'Welcome back'
  const subtitle = mode === 'signup' ? 'Create your account to get started' : 'Sign in to your account to continue'
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f4f4f8' }}>
      {/* Dark header band */}
      <div style={{
        background: 'linear-gradient(160deg, #1e1b4b 0%, #0d0f18 100%)',
        padding: '44px 24px 40px', position: 'relative', overflow: 'hidden', flexShrink: 0,
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
            <button onClick={onBack} style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', marginRight: 4,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>
            <ArchMark size={24} color="#818cf8" />
            <span style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Zenant</span>
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 6 }}>{heading}</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{subtitle}</p>
        </div>
      </div>

      {/* Form card overlapping the dark band */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 32px', marginTop: -20 }}>
        {children}
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#c4c4d0' }}>
          Secured by Clerk · <span style={{ color: '#9ca3af' }}>Privacy Policy</span>
        </div>
      </div>

      <div style={{ height: 3, background: 'linear-gradient(90deg, #4f46e5, #7c3aed, #0891b2)', flexShrink: 0 }} />
    </div>
  )
}

// ── Exported pages ────────────────────────────────────────────────────────────

export function SignInPage() {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)

  if (isMobile) {
    if (!showForm) return (
      <MobileSplash
        onGetStarted={() => navigate('/sign-up')}
        onSignIn={() => setShowForm(true)}
      />
    )
    return (
      <MobileForm onBack={() => setShowForm(false)} mode="signin">
        <SignIn routing="path" path="/sign-in" afterSignInUrl="/" appearance={clerkAppearanceMobile} />
      </MobileForm>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <LeftPanel />
      <RightPanel>
        <SignIn routing="path" path="/sign-in" afterSignInUrl="/" appearance={clerkAppearance} />
      </RightPanel>
    </div>
  )
}

export function SignUpPage() {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(true)

  if (isMobile) {
    if (!showForm) return (
      <MobileSplash
        onGetStarted={() => setShowForm(true)}
        onSignIn={() => navigate('/sign-in')}
      />
    )
    return (
      <MobileForm onBack={() => setShowForm(false)} mode="signup">
        <SignUp routing="path" path="/sign-up" afterSignUpUrl="/" appearance={clerkAppearanceMobile} />
      </MobileForm>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <LeftPanel />
      <RightPanel>
        <SignUp routing="path" path="/sign-up" afterSignUpUrl="/" appearance={clerkAppearance} />
      </RightPanel>
    </div>
  )
}
