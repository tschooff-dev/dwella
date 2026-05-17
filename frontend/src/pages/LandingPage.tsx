import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

const faqs = [
  {
    q: 'How do landlords screen tenants online?',
    a: 'Zenant runs a full background check, credit report, and income verification through our screening flow. You get an AI-generated summary scoring the applicant so you can decide in minutes, not days.',
  },
  {
    q: 'What does tenant screening include?',
    a: 'Our screening includes a credit report, nationwide criminal background check, eviction history, and income verification via bank connection. Everything a landlord needs to make a confident decision.',
  },
  {
    q: 'How do I collect rent online from tenants?',
    a: 'Tenants pay through their Zenant portal by ACH or card. Payments are automatically recorded, receipts sent, and funds deposited to your connected bank account.',
  },
  {
    q: 'Can landlords send lease agreements digitally?',
    a: "Yes — upload your lease PDF or use a template, add your tenant's email, and they'll receive a signing link. Signed leases are stored securely and accessible any time.",
  },
  {
    q: 'What is the best software for small landlords?',
    a: 'Most property management software is built for large operators and priced accordingly. Zenant is built specifically for independent landlords managing 1–50 units who need powerful tools without the enterprise price tag.',
  },
  {
    q: 'Is Zenant free for landlords?',
    a: 'Yes — Zenant is free for landlords. We charge a small processing fee on rent payments, similar to how Venmo or PayPal work. No monthly subscription required.',
  },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
}

const features = [
  {
    title: 'AI-Powered Tenant Screening',
    body: 'Run background checks, credit reports, and income verification in minutes. Get an AI summary so you can make confident decisions fast.',
    link: 'Learn about screening',
  },
  {
    title: 'Automatic Rent Collection',
    body: 'Tenants pay online, you get paid automatically. Late fee reminders go out without you lifting a finger. Track every payment from your dashboard.',
    link: 'See how payments work',
  },
  {
    title: 'Send & Sign Leases Online',
    body: 'Upload your lease, invite your tenant, collect their signature — done. No printing, no scanning, no back and forth.',
    link: 'Try lease signing',
  },
]

const steps = [
  {
    num: '01',
    title: 'Add your property',
    body: 'Create your account, add your building and units. Takes about two minutes.',
  },
  {
    num: '02',
    title: 'Invite your tenants',
    body: 'Send a link. Tenants create their portal, verify identity, and sign their lease.',
  },
  {
    num: '03',
    title: 'Get paid automatically',
    body: 'Rent hits your account on the due date. Late fees apply themselves.',
  },
]

const socialStats = [
  { value: '2,400+', label: 'landlords' },
  { value: '18,000+', label: 'units managed' },
  { value: '98%', label: 'on-time rent collection rate' },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 22px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          gap: 16,
          fontFamily: 'inherit',
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: '#0d0f18', flex: 1 }}>{q}</span>
        <span
          style={{
            fontSize: 22,
            fontWeight: 300,
            color: '#9ca3af',
            flexShrink: 0,
            lineHeight: 1,
            width: 24,
            textAlign: 'center',
            userSelect: 'none',
          }}
        >
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 22px 20px', fontSize: 14, color: '#6b7280', lineHeight: 1.7 }}>
          {a}
        </div>
      )}
    </div>
  )
}

export default function LandingPage() {
  const featuresRef = useRef<HTMLElement>(null)

  return (
    <>
      <Helmet>
        <title>Zenant — Property Management for Independent Landlords</title>
        <meta
          name="description"
          content="Screen tenants with AI, collect rent automatically, and send leases digitally. Free for landlords managing 1–50 units."
        />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <div style={{ minHeight: '100vh' }}>

        {/* NAVBAR */}
        <nav
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            background: '#fff',
            borderBottom: '1px solid #e6e6ef',
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: '0 auto',
              padding: '0 40px',
              height: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Link
              to="/"
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#0d0f18',
                textDecoration: 'none',
                letterSpacing: '-0.01em',
              }}
            >
              Zenant
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link to="/sign-in" className="btn-ghost" style={{ textDecoration: 'none' }}>
                Sign in
              </Link>
              <Link to="/sign-up" className="btn-primary" style={{ textDecoration: 'none' }}>
                Get started free
              </Link>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section style={{ background: '#f4f4f8', padding: '96px 40px 88px', textAlign: 'center' }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ marginBottom: 24 }}>
              <span className="badge badge-pending">Built for independent landlords</span>
            </div>
            <h1
              style={{
                fontSize: 52,
                fontWeight: 800,
                color: '#0d0f18',
                lineHeight: 1.12,
                letterSpacing: '-0.025em',
                margin: '0 0 20px',
              }}
            >
              The smarter way to manage your rentals
            </h1>
            <p
              style={{
                fontSize: 19,
                color: '#6b7280',
                lineHeight: 1.6,
                margin: '0 auto 36px',
                maxWidth: 520,
              }}
            >
              Screen tenants with AI, collect rent automatically, and send leases digitally — all in one place.
            </p>
            <div
              style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'center',
                alignItems: 'center',
                flexWrap: 'wrap',
                marginBottom: 22,
              }}
            >
              <Link
                to="/sign-up"
                className="btn-primary"
                style={{ fontSize: 16, padding: '13px 28px', textDecoration: 'none' }}
              >
                Get started free
              </Link>
              <button
                className="btn-ghost"
                onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })}
                style={{ fontSize: 16, padding: '13px 28px' }}
              >
                See how it works
              </button>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'center',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 13, color: '#9ca3af' }}>No credit card required</span>
              <span style={{ color: '#d1d5db', fontSize: 13 }}>·</span>
              <span style={{ fontSize: 13, color: '#9ca3af' }}>Free for landlords</span>
              <span style={{ color: '#d1d5db', fontSize: 13 }}>·</span>
              <span style={{ fontSize: 13, color: '#9ca3af' }}>Setup in 5 minutes</span>
            </div>
          </div>
        </section>

        {/* SOCIAL PROOF BAR */}
        <section
          style={{
            background: '#fff',
            borderTop: '1px solid #e6e6ef',
            borderBottom: '1px solid #e6e6ef',
            padding: '44px 40px',
          }}
        >
          <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 32, lineHeight: 1.6 }}>
              Trusted by independent landlords managing everything from single units to 50+ property portfolios
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 64, flexWrap: 'wrap' }}>
              {socialStats.map(s => (
                <div key={s.label}>
                  <div
                    style={{
                      fontSize: 30,
                      fontWeight: 800,
                      color: '#0d0f18',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {s.value}
                  </div>
                  <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 5 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" ref={featuresRef} style={{ padding: '88px 40px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <h2
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: '#0d0f18',
                  letterSpacing: '-0.02em',
                  marginBottom: 14,
                }}
              >
                Everything you need. Nothing you don't.
              </h2>
              <p style={{ fontSize: 17, color: '#6b7280', maxWidth: 500, margin: '0 auto' }}>
                Built for the independent landlord who doesn't want to pay AppFolio prices.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {features.map(f => (
                <div
                  key={f.title}
                  className="card"
                  style={{ padding: '30px 28px 26px', display: 'flex', flexDirection: 'column' }}
                >
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0d0f18', marginBottom: 12 }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 22, flex: 1 }}>
                    {f.body}
                  </p>
                  <Link
                    to="/sign-up"
                    style={{ fontSize: 13, fontWeight: 600, color: '#4f46e5', textDecoration: 'none' }}
                  >
                    {f.link} →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          style={{
            background: '#fff',
            borderTop: '1px solid #e6e6ef',
            borderBottom: '1px solid #e6e6ef',
            padding: '88px 40px',
          }}
        >
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <h2
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: '#0d0f18',
                  letterSpacing: '-0.02em',
                }}
              >
                Up and running in three steps
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {steps.map(s => (
                <div key={s.num} className="card" style={{ padding: '34px 28px' }}>
                  <div
                    style={{
                      fontSize: 38,
                      fontWeight: 800,
                      color: '#4f46e5',
                      lineHeight: 1,
                      marginBottom: 16,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {s.num}
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0d0f18', marginBottom: 10 }}>
                    {s.title}
                  </h3>
                  <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7 }}>{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: '88px 40px' }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <h2
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: '#0d0f18',
                  letterSpacing: '-0.02em',
                }}
              >
                Common questions
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {faqs.map(f => (
                <FaqItem key={f.q} q={f.q} a={f.a} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            padding: '88px 40px',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h2
              style={{
                fontSize: 38,
                fontWeight: 800,
                color: '#fff',
                letterSpacing: '-0.02em',
                marginBottom: 16,
              }}
            >
              Ready to simplify your rentals?
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.8)', marginBottom: 40, lineHeight: 1.6 }}>
              Join thousands of landlords who've ditched the spreadsheets.
            </p>
            <Link
              to="/sign-up"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '14px 34px',
                background: '#fff',
                color: '#4f46e5',
                fontWeight: 700,
                fontSize: 16,
                borderRadius: 10,
                textDecoration: 'none',
              }}
            >
              Get started free
            </Link>
          </div>
        </section>

        {/* FOOTER */}
        <footer
          style={{
            background: '#f4f4f8',
            borderTop: '1px solid #e6e6ef',
            padding: '28px 40px',
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 13, color: '#9ca3af' }}>© 2026 Zenant. All rights reserved.</span>
            <div style={{ display: 'flex', gap: 20 }}>
              {['Privacy Policy', 'Terms of Service', 'Contact'].map(label => (
                <a key={label} href="#" style={{ fontSize: 13, color: '#9ca3af', textDecoration: 'none' }}>
                  {label}
                </a>
              ))}
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
