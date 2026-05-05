import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'

export const seedRouter = Router()

// POST /api/seed/demo — one-time demo data seeder, protected by SEED_SECRET
seedRouter.post('/demo', async (req, res: Response) => {
  const secret = process.env.SEED_SECRET
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const LANDLORD_EMAIL = req.body.email ?? 'schoofft@gmail.com'

  try {
    // Ensure column exists in case migration was skipped
    await prisma.$executeRawUnsafe(`ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS "landlordNotes" TEXT`)

    const landlord = await prisma.user.findUnique({ where: { email: LANDLORD_EMAIL } })
    if (!landlord) return res.status(404).json({ error: `No user found: ${LANDLORD_EMAIL}` })
    if (landlord.role !== 'LANDLORD') return res.status(400).json({ error: 'User is not a LANDLORD' })

    const tenantData = [
      { firstName: 'James',   lastName: 'Wilson',   email: 'james.wilson.demo@zenantapp.com' },
      { firstName: 'Sarah',   lastName: 'Chen',     email: 'sarah.chen.demo@zenantapp.com' },
      { firstName: 'Marcus',  lastName: 'Johnson',  email: 'marcus.johnson.demo@zenantapp.com' },
      { firstName: 'Emily',   lastName: 'Davis',    email: 'emily.davis.demo@zenantapp.com' },
      { firstName: 'Robert',  lastName: 'Kim',      email: 'robert.kim.demo@zenantapp.com' },
      { firstName: 'Ashley',  lastName: 'Thompson', email: 'ashley.thompson.demo@zenantapp.com' },
    ]
    const tenants = await Promise.all(
      tenantData.map(t => prisma.user.upsert({ where: { email: t.email }, update: {}, create: { ...t, role: 'TENANT', phone: '555-0100' } }))
    )
    const [james, sarah, marcus, emily, robert, ashley] = tenants

    const portfolio = await prisma.portfolio.upsert({ where: { id: 'demo-portfolio-1' }, update: {}, create: { id: 'demo-portfolio-1', name: 'Main Portfolio', landlordId: landlord.id } })

    const prop1 = await prisma.property.upsert({ where: { id: 'demo-prop-1' }, update: {}, create: { id: 'demo-prop-1', name: 'Sunset Apartments', address: '412 W Diversey Pkwy', city: 'Chicago', state: 'IL', zip: '60614', description: 'Modern apartments in Lincoln Park with rooftop access.', landlordId: landlord.id, portfolioId: portfolio.id } })
    const prop2 = await prisma.property.upsert({ where: { id: 'demo-prop-2' }, update: {}, create: { id: 'demo-prop-2', name: 'Maple Grove Condos', address: '2801 S Congress Ave', city: 'Austin', state: 'TX', zip: '78704', description: 'South Congress condos walking distance to restaurants and bars.', landlordId: landlord.id, portfolioId: portfolio.id } })
    const prop3 = await prisma.property.upsert({ where: { id: 'demo-prop-3' }, update: {}, create: { id: 'demo-prop-3', name: 'Harbor View', address: '1900 Brickell Ave', city: 'Miami', state: 'FL', zip: '33129', description: 'Brickell high-rise with bay views and concierge.', landlordId: landlord.id } })

    const upsertUnit = (id: string, propertyId: string, unitNumber: string, beds: number, baths: number, sqft: number, rent: number, status: string) =>
      prisma.unit.upsert({ where: { id }, update: {}, create: { id, propertyId, unitNumber, bedrooms: beds, bathrooms: baths, squareFeet: sqft, rentAmount: rent, depositAmount: rent, status: status as any } })

    const [u1a, u2b, u3c, u101, u102, u103, u8a, u8b] = await Promise.all([
      upsertUnit('demo-unit-1', prop1.id, '1A',  2, 1,   900, 1850, 'OCCUPIED'),
      upsertUnit('demo-unit-2', prop1.id, '2B',  1, 1,   650, 1400, 'OCCUPIED'),
      upsertUnit('demo-unit-3', prop1.id, '3C',  3, 2,  1200, 2400, 'VACANT'),
      upsertUnit('demo-unit-4', prop2.id, '101', 2, 2,  1050, 1950, 'OCCUPIED'),
      upsertUnit('demo-unit-5', prop2.id, '102', 1, 1,   720, 1550, 'OCCUPIED'),
      upsertUnit('demo-unit-6', prop2.id, '103', 2, 1,   880, 1700, 'VACANT'),
      upsertUnit('demo-unit-7', prop3.id, '8A',  2, 2,  1100, 2800, 'OCCUPIED'),
      upsertUnit('demo-unit-8', prop3.id, '8B',  1, 1,   750, 2100, 'OCCUPIED'),
    ])

    const now = new Date()
    const mo = (n: number) => new Date(now.getFullYear(), now.getMonth() + n, 1)

    const upsertLease = (id: string, unitId: string, tenantId: string, startOffset: number, endOffset: number, rent: number) =>
      prisma.lease.upsert({ where: { id }, update: {}, create: { id, unitId, tenantId, startDate: mo(-startOffset), endDate: mo(endOffset), rentAmount: rent, depositPaid: rent, status: 'ACTIVE' } })

    const [l1, l2, l3, l4, l5, l6] = await Promise.all([
      upsertLease('demo-lease-1', u1a.id,  james.id,   8, 4,  1850),
      upsertLease('demo-lease-2', u2b.id,  sarah.id,   5, 7,  1400),
      upsertLease('demo-lease-3', u101.id, marcus.id, 11, 1,  1950),
      upsertLease('demo-lease-4', u102.id, emily.id,   3, 9,  1550),
      upsertLease('demo-lease-5', u8a.id,  robert.id,  6, 6,  2800),
      upsertLease('demo-lease-6', u8b.id,  ashley.id,  2, 10, 2100),
    ])

    const payments: any[] = []
    const pay = (id: string, leaseId: string, tenantId: string, amount: number, moOffset: number, status: string, method?: string) => ({
      id, leaseId, tenantId, amount, dueDate: mo(moOffset),
      ...(status === 'PAID' ? { paidDate: mo(moOffset), status: 'PAID', method: method ?? 'card' } : { status }),
    })
    // James: 3 paid + 1 due
    for (let i = 3; i >= 1; i--) payments.push(pay(`demo-pay-l1-${i}`, l1.id, james.id, 1850, -i, 'PAID'))
    payments.push(pay('demo-pay-l1-0', l1.id, james.id, 1850, 0, 'DUE'))
    // Sarah: 2 paid + 1 late + 1 due
    payments.push(pay('demo-pay-l2-3', l2.id, sarah.id, 1400, -3, 'PAID', 'ach'))
    payments.push(pay('demo-pay-l2-2', l2.id, sarah.id, 1400, -2, 'PAID', 'ach'))
    payments.push(pay('demo-pay-l2-1', l2.id, sarah.id, 1400, -1, 'LATE'))
    payments.push(pay('demo-pay-l2-0', l2.id, sarah.id, 1400, 0, 'DUE'))
    // Marcus: 3 paid + 1 due
    for (let i = 3; i >= 1; i--) payments.push(pay(`demo-pay-l3-${i}`, l3.id, marcus.id, 1950, -i, 'PAID'))
    payments.push(pay('demo-pay-l3-0', l3.id, marcus.id, 1950, 0, 'DUE'))
    // Emily: 2 paid + 1 due
    payments.push(pay('demo-pay-l4-2', l4.id, emily.id, 1550, -2, 'PAID'))
    payments.push(pay('demo-pay-l4-1', l4.id, emily.id, 1550, -1, 'PAID'))
    payments.push(pay('demo-pay-l4-0', l4.id, emily.id, 1550, 0, 'DUE'))
    // Robert: 3 paid + 1 due
    for (let i = 3; i >= 1; i--) payments.push(pay(`demo-pay-l5-${i}`, l5.id, robert.id, 2800, -i, 'PAID'))
    payments.push(pay('demo-pay-l5-0', l5.id, robert.id, 2800, 0, 'DUE'))
    // Ashley: 1 paid + 1 due
    payments.push(pay('demo-pay-l6-1', l6.id, ashley.id, 2100, -1, 'PAID', 'ach'))
    payments.push(pay('demo-pay-l6-0', l6.id, ashley.id, 2100, 0, 'DUE'))

    for (const p of payments) {
      const { id, ...data } = p
      await prisma.payment.upsert({ where: { id }, update: {}, create: { id, ...data } })
    }

    const maintenance = [
      { id: 'demo-maint-1', unitId: u1a.id,  tenantId: james.id,  title: 'Kitchen faucet leaking',         description: 'The hot water handle has been dripping constantly. Water pooling under the sink.',                     priority: 'HIGH',   status: 'IN_PROGRESS', createdAt: new Date(now.getTime() - 5*86400000) },
      { id: 'demo-maint-2', unitId: u2b.id,  tenantId: sarah.id,  title: 'HVAC not cooling properly',       description: 'AC is running but can\'t get below 78°F even with thermostat at 68°F.',                              priority: 'URGENT', status: 'OPEN',        createdAt: new Date(now.getTime() - 1*86400000) },
      { id: 'demo-maint-3', unitId: u101.id, tenantId: marcus.id, title: 'Dishwasher door latch broken',    description: 'The door latch is broken — door won\'t stay closed during a cycle.',                                  priority: 'MEDIUM', status: 'RESOLVED',    resolvedAt: new Date(now.getTime() - 2*86400000), createdAt: new Date(now.getTime() - 10*86400000) },
      { id: 'demo-maint-4', unitId: u8a.id,  tenantId: robert.id, title: 'Bathroom exhaust fan noisy',      description: 'Loud rattling noise from the master bathroom exhaust fan when turned on.',                            priority: 'LOW',    status: 'OPEN',        createdAt: new Date(now.getTime() - 3*86400000) },
      { id: 'demo-maint-5', unitId: u102.id, tenantId: emily.id,  title: "Bedroom window won't lock",       description: 'Locking mechanism on the main bedroom window is stuck — cannot be secured.',                         priority: 'HIGH',   status: 'OPEN',        createdAt: new Date(now.getTime() - 2*86400000) },
      { id: 'demo-maint-6', unitId: u8b.id,  tenantId: ashley.id, title: 'Light fixture flickering',        description: 'Overhead light in living room flickers on and off. Already replaced the bulb.',                      priority: 'MEDIUM', status: 'IN_PROGRESS', createdAt: new Date(now.getTime() - 7*86400000) },
    ]
    for (const { id, ...data } of maintenance) {
      await prisma.maintenanceRequest.upsert({ where: { id }, update: {}, create: { id, ...data as any } })
    }

    const apps = [
      { id: 'demo-app-1', unitId: u3c.id,  applicantName: 'Tyler Brooks',  applicantEmail: 'tyler.brooks@email.com',  applicantPhone: '555-0201', monthlyIncome: 7200, creditScore: 730, aiScore: 85, aiSummary: 'Tyler Brooks reports income of $7,200/mo and a credit score of 730. Strong applicant. AI screening score: 85/100.', status: 'PENDING',  submittedAt: new Date(now.getTime() - 2*86400000) },
      { id: 'demo-app-2', unitId: u3c.id,  applicantName: 'Priya Nair',    applicantEmail: 'priya.nair@email.com',    applicantPhone: '555-0202', monthlyIncome: 5800, creditScore: 690, aiScore: 68, aiSummary: 'Priya Nair reports income of $5,800/mo and a credit score of 690. Moderate applicant. AI screening score: 68/100.',   status: 'PENDING',  submittedAt: new Date(now.getTime() - 1*86400000) },
      { id: 'demo-app-3', unitId: u103.id, applicantName: 'Daniel Park',   applicantEmail: 'daniel.park@email.com',   applicantPhone: '555-0203', monthlyIncome: 9500, creditScore: 780, aiScore: 95, aiSummary: 'Daniel Park reports income of $9,500/mo and a credit score of 780. Strong applicant. AI screening score: 95/100.',   status: 'APPROVED', submittedAt: new Date(now.getTime() - 8*86400000), reviewedAt: new Date(now.getTime() - 6*86400000) },
      { id: 'demo-app-4', unitId: u103.id, applicantName: 'Keisha Monroe', applicantEmail: 'keisha.monroe@email.com', applicantPhone: '555-0204', monthlyIncome: 3800, creditScore: 580, aiScore: 32, aiSummary: 'Keisha Monroe reports income of $3,800/mo and a credit score of 580. Higher-risk applicant. AI screening score: 32/100.', status: 'REJECTED', submittedAt: new Date(now.getTime() - 5*86400000), reviewedAt: new Date(now.getTime() - 4*86400000) },
    ]
    for (const { id, ...data } of apps) {
      await prisma.application.upsert({ where: { id }, update: {}, create: { id, ...data as any } })
    }

    const msgs = [
      { id: 'demo-msg-1', leaseId: l1.id, senderId: james.id,   body: "Hi! Just wanted to confirm the maintenance guy is coming Thursday 9-11am for the faucet. Does that still work?",                         readAt: new Date(now.getTime() - 4*86400000), createdAt: new Date(now.getTime() - 5*86400000) },
      { id: 'demo-msg-2', leaseId: l1.id, senderId: landlord.id, body: "Yes, Thursday 9-11am confirmed. They'll have the parts ready. Let me know if anything changes!",                                         readAt: new Date(now.getTime() - 4*86400000), createdAt: new Date(now.getTime() - 4.5*86400000) },
      { id: 'demo-msg-3', leaseId: l2.id, senderId: sarah.id,   body: "The AC is completely broken now — it won't turn on at all. It's 85°F in here. Please help ASAP.",                                        createdAt: new Date(now.getTime() - 0.5*86400000) },
      { id: 'demo-msg-4', leaseId: l5.id, senderId: robert.id,  body: "Hey, quick question — is the building getting exterior work done soon? I noticed scaffolding going up on the west side.",                  readAt: new Date(now.getTime() - 2*86400000), createdAt: new Date(now.getTime() - 3*86400000) },
      { id: 'demo-msg-5', leaseId: l5.id, senderId: landlord.id, body: "Yes! The HOA approved window replacement for units 8A-10C starting next month. They'll reach out to schedule access.",                    readAt: new Date(now.getTime() - 2*86400000), createdAt: new Date(now.getTime() - 2.5*86400000) },
      { id: 'demo-msg-6', leaseId: l3.id, senderId: marcus.id,  body: "Hi, my lease is up in about a month. I'd love to renew for another year if possible. Are the rates staying the same?",                    createdAt: new Date(now.getTime() - 1*86400000) },
    ]
    for (const { id, ...data } of msgs) {
      await prisma.message.upsert({ where: { id }, update: {}, create: { id, ...data as any } })
    }

    res.json({
      ok: true,
      summary: { properties: 3, units: 8, tenants: 6, leases: 6, payments: payments.length, maintenance: maintenance.length, applications: apps.length, messages: msgs.length },
    })
  } catch (err: any) {
    console.error('Seed error:', err)
    res.status(500).json({ error: err.message })
  }
})
