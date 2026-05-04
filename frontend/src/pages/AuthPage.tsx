import { SignIn, SignUp } from '@clerk/clerk-react'

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
    headerTitle: {
      fontSize: '20px',
      fontWeight: '800',
      color: '#0d0f18',
      letterSpacing: '-0.02em',
    },
    headerSubtitle: {
      fontSize: '13px',
      color: '#9ca3af',
    },
    socialButtonsBlockButton: {
      background: '#ffffff',
      border: '1.5px solid #e6e6ef',
      borderRadius: '10px',
      fontSize: '13px',
      fontWeight: '600',
      color: '#0d0f18',
      transition: 'border-color 0.15s, box-shadow 0.15s',
    },
    socialButtonsBlockButton__hover: {
      borderColor: '#c7d2fe',
      boxShadow: '0 2px 8px rgba(79,70,229,0.1)',
    },
    dividerLine: { background: '#f0f0f5' },
    dividerText: { fontSize: '11px', color: '#c4c4d0', fontWeight: '600' },
    formFieldLabel: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#374151',
    },
    formFieldInput: {
      border: '1.5px solid #e6e6ef',
      borderRadius: '9px',
      padding: '11px 14px',
      fontSize: '13px',
      color: '#0d0f18',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    },
    formButtonPrimary: {
      background: '#0d0f18',
      borderRadius: '9px',
      fontSize: '13px',
      fontWeight: '700',
      padding: '12px',
      transition: 'background 0.15s',
    },
    footerActionLink: {
      color: '#4f46e5',
      fontWeight: '700',
    },
    footer: {
      '& + div': { display: 'none' },
    },
    identityPreviewText: { color: '#0d0f18' },
    formResendCodeLink: { color: '#4f46e5' },
    otpCodeFieldInput: {
      border: '1.5px solid #e6e6ef',
      borderRadius: '9px',
      fontSize: '18px',
      fontWeight: '700',
    },
  },
}

function ZenantLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width={34} height={36} viewBox="0 0 44 46">
        <path
          fillRule="evenodd"
          d="M4 44 L4 20 A18 18 0 0 1 40 20 L40 44 Z M14 44 L14 32 Q14 28 22 28 Q30 28 30 32 L30 44 Z"
          fill="#fff"
        />
        <rect x="0" y="44" width="44" height="2" rx="1" fill="#fff" opacity="0.35" />
      </svg>
      <span style={{ fontSize: 25, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>Zenant</span>
    </div>
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
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={i === 0 ? 2 : 1.5}
            opacity={1 - i * 0.15}
          />
        </g>
      ))}
    </svg>
  )
}

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
        background: 'radial-gradient(circle, rgba(79,70,229,0.25) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 2 }}>
        <ZenantLogo />
      </div>

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 460 }}>
        <div style={{
          display: 'inline-block', background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.3)',
          borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600,
          color: '#a5b4fc', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 22,
        }}>
          Property Management, Simplified
        </div>

        <h1 style={{
          fontSize: 44, fontWeight: 900, color: '#fff', lineHeight: 1.1,
          letterSpacing: '-0.03em', marginBottom: 18,
        }}>
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

        <div style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14, padding: '20px 22px',
        }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 14 }}>
            "{TESTIMONIAL.quote}"
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(79,70,229,0.4)', border: '1.5px solid rgba(129,140,248,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#a5b4fc',
            }}>
              {TESTIMONIAL.initials}
            </div>
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

function RightPanel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: 520, flexShrink: 0, background: '#f4f4f8',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '48px 40px', position: 'relative',
    }}>
      <div style={{ position: 'absolute', top: 32, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="18" height="20" viewBox="0 0 44 46">
            <path
              fillRule="evenodd"
              d="M4 44 L4 20 A18 18 0 0 1 40 20 L40 44 Z M14 44 L14 32 Q14 28 22 28 Q30 28 30 32 L30 44 Z"
              fill="#4f46e5"
            />
            <rect x="0" y="44" width="44" height="2" rx="1" fill="#4f46e5" opacity="0.3" />
          </svg>
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

export function SignInPage() {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <LeftPanel />
      <RightPanel>
        <SignIn
          routing="path"
          path="/sign-in"
          afterSignInUrl="/"
          appearance={clerkAppearance}
        />
      </RightPanel>
    </div>
  )
}

export function SignUpPage() {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <LeftPanel />
      <RightPanel>
        <SignUp
          routing="path"
          path="/sign-up"
          afterSignUpUrl="/"
          appearance={clerkAppearance}
        />
      </RightPanel>
    </div>
  )
}
