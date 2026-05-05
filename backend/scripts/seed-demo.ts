import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const LANDLORD_EMAIL = 'schoofft@gmail.com'

  const landlord = await prisma.user.findUnique({ where: { email: LANDLORD_EMAIL } })
  if (!landlord) throw new Error(`No user found with email ${LANDLORD_EMAIL}`)
  if (landlord.role !== 'LANDLORD') throw new Error(`${LANDLORD_EMAIL} is not a LANDLORD`)

  console.log(`Seeding demo data for ${landlord.firstName} ${landlord.lastName} (${landlord.id})`)

  // ── Tenants ──────────────────────────────────────────────────────────────────
  const tenantData = [
    { firstName: 'James',   lastName: 'Wilson',    email: 'james.wilson.demo@zenantapp.com' },
    { firstName: 'Sarah',   lastName: 'Chen',      email: 'sarah.chen.demo@zenantapp.com' },
    { firstName: 'Marcus',  lastName: 'Johnson',   email: 'marcus.johnson.demo@zenantapp.com' },
    { firstName: 'Emily',   lastName: 'Davis',     email: 'emily.davis.demo@zenantapp.com' },
    { firstName: 'Robert',  lastName: 'Kim',       email: 'robert.kim.demo@zenantapp.com' },
    { firstName: 'Ashley',  lastName: 'Thompson',  email: 'ashley.thompson.demo@zenantapp.com' },
  ]

  const tenants = await Promise.all(
    tenantData.map(t =>
      prisma.user.upsert({
        where: { email: t.email },
        update: {},
        create: { ...t, role: 'TENANT', phone: `555-0${Math.floor(100 + Math.random() * 900)}` },
      })
    )
  )
  const [james, sarah, marcus, emily, robert, ashley] = tenants
  console.log(`Created ${tenants.length} tenant users`)

  // ── Portfolio ─────────────────────────────────────────────────────────────────
  const portfolio = await prisma.portfolio.upsert({
    where: { id: 'demo-portfolio-1' },
    update: {},
    create: {
      id: 'demo-portfolio-1',
      name: 'Main Portfolio',
      landlordId: landlord.id,
    },
  })

  // ── Properties ────────────────────────────────────────────────────────────────
  const prop1 = await prisma.property.upsert({
    where: { id: 'demo-prop-1' },
    update: {},
    create: {
      id: 'demo-prop-1',
      name: 'Sunset Apartments',
      address: '412 W Diversey Pkwy',
      city: 'Chicago', state: 'IL', zip: '60614',
      description: 'Modern apartments in Lincoln Park with rooftop access.',
      landlordId: landlord.id,
      portfolioId: portfolio.id,
    },
  })

  const prop2 = await prisma.property.upsert({
    where: { id: 'demo-prop-2' },
    update: {},
    create: {
      id: 'demo-prop-2',
      name: 'Maple Grove Condos',
      address: '2801 S Congress Ave',
      city: 'Austin', state: 'TX', zip: '78704',
      description: 'South Congress condos walking distance to restaurants and bars.',
      landlordId: landlord.id,
      portfolioId: portfolio.id,
    },
  })

  const prop3 = await prisma.property.upsert({
    where: { id: 'demo-prop-3' },
    update: {},
    create: {
      id: 'demo-prop-3',
      name: 'Harbor View',
      address: '1900 Brickell Ave',
      city: 'Miami', state: 'FL', zip: '33129',
      description: 'Brickell high-rise with bay views and concierge.',
      landlordId: landlord.id,
    },
  })

  console.log(`Created 3 properties`)

  // ── Units ─────────────────────────────────────────────────────────────────────
  const units = await Promise.all([
    // Sunset Apartments — 3 units
    prisma.unit.upsert({ where: { id: 'demo-unit-1' }, update: {}, create: { id: 'demo-unit-1', propertyId: prop1.id, unitNumber: '1A', bedrooms: 2, bathrooms: 1, squareFeet: 900, rentAmount: 1850, depositAmount: 1850, status: 'OCCUPIED' } }),
    prisma.unit.upsert({ where: { id: 'demo-unit-2' }, update: {}, create: { id: 'demo-unit-2', propertyId: prop1.id, unitNumber: '2B', bedrooms: 1, bathrooms: 1, squareFeet: 650, rentAmount: 1400, depositAmount: 1400, status: 'OCCUPIED' } }),
    prisma.unit.upsert({ where: { id: 'demo-unit-3' }, update: {}, create: { id: 'demo-unit-3', propertyId: prop1.id, unitNumber: '3C', bedrooms: 3, bathrooms: 2, squareFeet: 1200, rentAmount: 2400, depositAmount: 2400, status: 'VACANT' } }),
    // Maple Grove — 3 units
    prisma.unit.upsert({ where: { id: 'demo-unit-4' }, update: {}, create: { id: 'demo-unit-4', propertyId: prop2.id, unitNumber: '101', bedrooms: 2, bathrooms: 2, squareFeet: 1050, rentAmount: 1950, depositAmount: 1950, status: 'OCCUPIED' } }),
    prisma.unit.upsert({ where: { id: 'demo-unit-5' }, update: {}, create: { id: 'demo-unit-5', propertyId: prop2.id, unitNumber: '102', bedrooms: 1, bathrooms: 1, squareFeet: 720, rentAmount: 1550, depositAmount: 1550, status: 'OCCUPIED' } }),
    prisma.unit.upsert({ where: { id: 'demo-unit-6' }, update: {}, create: { id: 'demo-unit-6', propertyId: prop2.id, unitNumber: '103', bedrooms: 2, bathrooms: 1, squareFeet: 880, rentAmount: 1700, depositAmount: 1700, status: 'VACANT' } }),
    // Harbor View — 2 units
    prisma.unit.upsert({ where: { id: 'demo-unit-7' }, update: {}, create: { id: 'demo-unit-7', propertyId: prop3.id, unitNumber: '8A', bedrooms: 2, bathrooms: 2, squareFeet: 1100, rentAmount: 2800, depositAmount: 2800, status: 'OCCUPIED' } }),
    prisma.unit.upsert({ where: { id: 'demo-unit-8' }, update: {}, create: { id: 'demo-unit-8', propertyId: prop3.id, unitNumber: '8B', bedrooms: 1, bathrooms: 1, squareFeet: 750, rentAmount: 2100, depositAmount: 2100, status: 'OCCUPIED' } }),
  ])
  const [u1a, u2b, u3c, u101, u102, u103, u8a, u8b] = units
  console.log(`Created ${units.length} units`)

  // ── Leases ────────────────────────────────────────────────────────────────────
  const now = new Date()
  const leaseStart = (monthsAgo: number) => new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1)
  const leaseEnd = (monthsFromNow: number) => new Date(now.getFullYear(), now.getMonth() + monthsFromNow, 1)

  const leases = await Promise.all([
    prisma.lease.upsert({ where: { id: 'demo-lease-1' }, update: {}, create: { id: 'demo-lease-1', unitId: u1a.id, tenantId: james.id, startDate: leaseStart(8), endDate: leaseEnd(4), rentAmount: 1850, depositPaid: 1850, status: 'ACTIVE' } }),
    prisma.lease.upsert({ where: { id: 'demo-lease-2' }, update: {}, create: { id: 'demo-lease-2', unitId: u2b.id, tenantId: sarah.id, startDate: leaseStart(5), endDate: leaseEnd(7), rentAmount: 1400, depositPaid: 1400, status: 'ACTIVE' } }),
    prisma.lease.upsert({ where: { id: 'demo-lease-3' }, update: {}, create: { id: 'demo-lease-3', unitId: u101.id, tenantId: marcus.id, startDate: leaseStart(11), endDate: leaseEnd(1), rentAmount: 1950, depositPaid: 1950, status: 'ACTIVE' } }),
    prisma.lease.upsert({ where: { id: 'demo-lease-4' }, update: {}, create: { id: 'demo-lease-4', unitId: u102.id, tenantId: emily.id, startDate: leaseStart(3), endDate: leaseEnd(9), rentAmount: 1550, depositPaid: 1550, status: 'ACTIVE' } }),
    prisma.lease.upsert({ where: { id: 'demo-lease-5' }, update: {}, create: { id: 'demo-lease-5', unitId: u8a.id, tenantId: robert.id, startDate: leaseStart(6), endDate: leaseEnd(6), rentAmount: 2800, depositPaid: 2800, status: 'ACTIVE' } }),
    prisma.lease.upsert({ where: { id: 'demo-lease-6' }, update: {}, create: { id: 'demo-lease-6', unitId: u8b.id, tenantId: ashley.id, startDate: leaseStart(2), endDate: leaseEnd(10), rentAmount: 2100, depositPaid: 2100, status: 'ACTIVE' } }),
  ])
  const [l1, l2, l3, l4, l5, l6] = leases
  console.log(`Created ${leases.length} leases`)

  // ── Payments ──────────────────────────────────────────────────────────────────
  function monthDate(year: number, month: number) {
    return new Date(year, month, 1)
  }
  const y = now.getFullYear()
  const m = now.getMonth() // 0-indexed

  const payments = []

  // James — lease 1 (1850/mo): 3 months paid, current month due
  for (let i = 3; i >= 1; i--) {
    payments.push({ id: `demo-pay-l1-${i}`, leaseId: l1.id, tenantId: james.id, amount: 1850, dueDate: monthDate(y, m - i), paidDate: monthDate(y, m - i), status: 'PAID', stripePaymentId: `demo_pi_${Math.random().toString(36).slice(2)}`, method: 'card' })
  }
  payments.push({ id: `demo-pay-l1-0`, leaseId: l1.id, tenantId: james.id, amount: 1850, dueDate: monthDate(y, m), status: 'DUE' })

  // Sarah — lease 2 (1400/mo): 2 months paid, one late
  payments.push({ id: `demo-pay-l2-3`, leaseId: l2.id, tenantId: sarah.id, amount: 1400, dueDate: monthDate(y, m - 3), paidDate: monthDate(y, m - 3), status: 'PAID', method: 'ach' })
  payments.push({ id: `demo-pay-l2-2`, leaseId: l2.id, tenantId: sarah.id, amount: 1400, dueDate: monthDate(y, m - 2), paidDate: monthDate(y, m - 2), status: 'PAID', method: 'ach' })
  payments.push({ id: `demo-pay-l2-1`, leaseId: l2.id, tenantId: sarah.id, amount: 1400, dueDate: monthDate(y, m - 1), status: 'LATE' })
  payments.push({ id: `demo-pay-l2-0`, leaseId: l2.id, tenantId: sarah.id, amount: 1400, dueDate: monthDate(y, m), status: 'DUE' })

  // Marcus — lease 3 (1950/mo): all paid on time
  for (let i = 3; i >= 0; i--) {
    const paid = i > 0
    payments.push({ id: `demo-pay-l3-${i}`, leaseId: l3.id, tenantId: marcus.id, amount: 1950, dueDate: monthDate(y, m - i), ...(paid ? { paidDate: monthDate(y, m - i), status: 'PAID', method: 'card' } : { status: 'DUE' }) })
  }

  // Emily — lease 4 (1550/mo): 2 paid
  payments.push({ id: `demo-pay-l4-2`, leaseId: l4.id, tenantId: emily.id, amount: 1550, dueDate: monthDate(y, m - 2), paidDate: monthDate(y, m - 2), status: 'PAID', method: 'card' })
  payments.push({ id: `demo-pay-l4-1`, leaseId: l4.id, tenantId: emily.id, amount: 1550, dueDate: monthDate(y, m - 1), paidDate: monthDate(y, m - 1), status: 'PAID', method: 'card' })
  payments.push({ id: `demo-pay-l4-0`, leaseId: l4.id, tenantId: emily.id, amount: 1550, dueDate: monthDate(y, m), status: 'DUE' })

  // Robert — lease 5 (2800/mo): paid
  for (let i = 3; i >= 1; i--) {
    payments.push({ id: `demo-pay-l5-${i}`, leaseId: l5.id, tenantId: robert.id, amount: 2800, dueDate: monthDate(y, m - i), paidDate: monthDate(y, m - i), status: 'PAID', method: 'card' })
  }
  payments.push({ id: `demo-pay-l5-0`, leaseId: l5.id, tenantId: robert.id, amount: 2800, dueDate: monthDate(y, m), status: 'DUE' })

  // Ashley — lease 6 (2100/mo): just started
  payments.push({ id: `demo-pay-l6-1`, leaseId: l6.id, tenantId: ashley.id, amount: 2100, dueDate: monthDate(y, m - 1), paidDate: monthDate(y, m - 1), status: 'PAID', method: 'ach' })
  payments.push({ id: `demo-pay-l6-0`, leaseId: l6.id, tenantId: ashley.id, amount: 2100, dueDate: monthDate(y, m), status: 'DUE' })

  for (const p of payments) {
    const { id, ...data } = p as any
    await prisma.payment.upsert({ where: { id }, update: {}, create: { id, ...data } })
  }
  console.log(`Created ${payments.length} payments`)

  // ── Maintenance Requests ──────────────────────────────────────────────────────
  const maintenanceItems = [
    { id: 'demo-maint-1', unitId: u1a.id, tenantId: james.id, title: 'Kitchen faucet leaking', description: 'The hot water handle on the kitchen faucet has been dripping constantly for the past week. Water is pooling under the sink.', priority: 'HIGH', status: 'IN_PROGRESS', createdAt: new Date(now.getTime() - 5 * 86400000) },
    { id: 'demo-maint-2', unitId: u2b.id, tenantId: sarah.id, title: 'HVAC not cooling properly', description: 'Air conditioning is running but the apartment is not getting below 78°F even with thermostat set to 68°F.', priority: 'URGENT', status: 'OPEN', createdAt: new Date(now.getTime() - 1 * 86400000) },
    { id: 'demo-maint-3', unitId: u101.id, tenantId: marcus.id, title: 'Dishwasher door latch broken', description: 'The door latch on the dishwasher is broken and the door won\'t stay closed during a cycle.', priority: 'MEDIUM', status: 'RESOLVED', resolvedAt: new Date(now.getTime() - 2 * 86400000), createdAt: new Date(now.getTime() - 10 * 86400000) },
    { id: 'demo-maint-4', unitId: u8a.id, tenantId: robert.id, title: 'Bathroom exhaust fan noisy', description: 'The exhaust fan in the master bathroom makes a loud rattling noise when turned on.', priority: 'LOW', status: 'OPEN', createdAt: new Date(now.getTime() - 3 * 86400000) },
    { id: 'demo-maint-5', unitId: u102.id, tenantId: emily.id, title: 'Bedroom window won\'t lock', description: 'The locking mechanism on the main bedroom window is stuck and the window cannot be secured.', priority: 'HIGH', status: 'OPEN', createdAt: new Date(now.getTime() - 2 * 86400000) },
    { id: 'demo-maint-6', unitId: u8b.id, tenantId: ashley.id, title: 'Light fixture flickering in living room', description: 'The overhead light in the living room flickers on and off. Already tried replacing the bulb.', priority: 'MEDIUM', status: 'IN_PROGRESS', createdAt: new Date(now.getTime() - 7 * 86400000) },
  ]

  for (const m of maintenanceItems) {
    const { id, ...data } = m as any
    await prisma.maintenanceRequest.upsert({ where: { id }, update: {}, create: { id, ...data } })
  }
  console.log(`Created ${maintenanceItems.length} maintenance requests`)

  // ── Applications ──────────────────────────────────────────────────────────────
  const applications = [
    { id: 'demo-app-1', unitId: u3c.id, applicantName: 'Tyler Brooks', applicantEmail: 'tyler.brooks@email.com', applicantPhone: '555-0201', monthlyIncome: 7200, creditScore: 730, aiScore: 85, aiSummary: 'Tyler Brooks reports income of $7,200/mo and a credit score of 730. Strong applicant. AI screening score: 85/100.', status: 'PENDING', submittedAt: new Date(now.getTime() - 2 * 86400000) },
    { id: 'demo-app-2', unitId: u3c.id, applicantName: 'Priya Nair', applicantEmail: 'priya.nair@email.com', applicantPhone: '555-0202', monthlyIncome: 5800, creditScore: 690, aiScore: 68, aiSummary: 'Priya Nair reports income of $5,800/mo and a credit score of 690. Moderate applicant. AI screening score: 68/100.', status: 'PENDING', submittedAt: new Date(now.getTime() - 1 * 86400000) },
    { id: 'demo-app-3', unitId: u103.id, applicantName: 'Daniel Park', applicantEmail: 'daniel.park@email.com', applicantPhone: '555-0203', monthlyIncome: 9500, creditScore: 780, aiScore: 95, aiSummary: 'Daniel Park reports income of $9,500/mo and a credit score of 780. Strong applicant. AI screening score: 95/100.', status: 'APPROVED', submittedAt: new Date(now.getTime() - 8 * 86400000), reviewedAt: new Date(now.getTime() - 6 * 86400000) },
    { id: 'demo-app-4', unitId: u103.id, applicantName: 'Keisha Monroe', applicantEmail: 'keisha.monroe@email.com', applicantPhone: '555-0204', monthlyIncome: 3800, creditScore: 580, aiScore: 32, aiSummary: 'Keisha Monroe reports income of $3,800/mo and a credit score of 580. Higher-risk applicant. AI screening score: 32/100.', status: 'REJECTED', submittedAt: new Date(now.getTime() - 5 * 86400000), reviewedAt: new Date(now.getTime() - 4 * 86400000) },
  ]

  for (const a of applications) {
    const { id, ...data } = a as any
    await prisma.application.upsert({ where: { id }, update: {}, create: { id, ...data } })
  }
  console.log(`Created ${applications.length} applications`)

  // ── Messages ──────────────────────────────────────────────────────────────────
  const messages = [
    { id: 'demo-msg-1', leaseId: l1.id, senderId: james.id, body: 'Hi! Just wanted to confirm that the maintenance guy is coming Thursday between 9-11am for the faucet. Does that still work?', readAt: new Date(now.getTime() - 4 * 86400000), createdAt: new Date(now.getTime() - 5 * 86400000) },
    { id: 'demo-msg-2', leaseId: l1.id, senderId: landlord.id, body: 'Yes, Thursday 9-11am is confirmed. They\'ll have the replacement parts ready. Let me know if anything changes!', readAt: new Date(now.getTime() - 4 * 86400000), createdAt: new Date(now.getTime() - 4.5 * 86400000) },
    { id: 'demo-msg-3', leaseId: l2.id, senderId: sarah.id, body: 'The AC is completely broken now — it was bad before but now it won\'t turn on at all. It\'s 85 degrees in here. Please help ASAP.', createdAt: new Date(now.getTime() - 0.5 * 86400000) },
    { id: 'demo-msg-4', leaseId: l5.id, senderId: robert.id, body: 'Hey, quick question — is the building getting any exterior work done soon? I noticed some scaffolding going up on the west side.', readAt: new Date(now.getTime() - 2 * 86400000), createdAt: new Date(now.getTime() - 3 * 86400000) },
    { id: 'demo-msg-5', leaseId: l5.id, senderId: landlord.id, body: 'Yes! The HOA approved window replacement for units 8A-10C starting next month. They\'ll reach out directly to schedule access.', readAt: new Date(now.getTime() - 2 * 86400000), createdAt: new Date(now.getTime() - 2.5 * 86400000) },
    { id: 'demo-msg-6', leaseId: l3.id, senderId: marcus.id, body: 'Hi, my lease is up in about a month. I\'d love to renew for another year if possible. Are the rates staying the same?', createdAt: new Date(now.getTime() - 1 * 86400000) },
  ]

  for (const msg of messages) {
    const { id, ...data } = msg as any
    await prisma.message.upsert({ where: { id }, update: {}, create: { id, ...data } })
  }
  console.log(`Created ${messages.length} messages`)

  console.log('\n✅ Demo seed complete!')
  console.log(`   Properties: 3  |  Units: 8  |  Tenants: 6  |  Leases: 6`)
  console.log(`   Payments: ${payments.length}  |  Maintenance: ${maintenanceItems.length}  |  Applications: ${applications.length}  |  Messages: ${messages.length}`)
}

main()
  .catch(err => { console.error('Seed failed:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())
