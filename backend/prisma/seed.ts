import { PrismaClient, PaymentStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Dwella database...')

  // Clean up
  await prisma.maintenanceRequest.deleteMany()
  await prisma.application.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.lease.deleteMany()
  await prisma.unit.deleteMany()
  await prisma.property.deleteMany()
  await prisma.user.deleteMany()

  // ---- Landlord ----
  const landlord = await prisma.user.create({
    data: {
      email: 'owner@dwella.app',
      firstName: 'Marcus',
      lastName: 'Holt',
      role: 'LANDLORD',
      phone: '555-010-0001',
    },
  })

  // ---- Properties ----
  const elmwood = await prisma.property.create({
    data: {
      name: 'The Elmwood',
      address: '142 Elmwood Ave',
      city: 'Portland',
      state: 'OR',
      zip: '97201',
      description: 'Classic brick building with 6 units in the heart of the Pearl District.',
      landlordId: landlord.id,
    },
  })

  const riverside = await prisma.property.create({
    data: {
      name: 'Riverside Commons',
      address: '890 River Rd',
      city: 'Portland',
      state: 'OR',
      zip: '97209',
      description: 'Modern 4-unit complex with river views and private parking.',
      landlordId: landlord.id,
    },
  })

  const harbor = await prisma.property.create({
    data: {
      name: 'Harbor View',
      address: '33 Harbor Blvd',
      city: 'Portland',
      state: 'OR',
      zip: '97217',
      description: 'Two-unit duplex with updated kitchens and in-unit laundry.',
      landlordId: landlord.id,
    },
  })

  // ---- Units: Elmwood (6 units) ----
  const elmwoodUnits = await Promise.all([
    prisma.unit.create({ data: { propertyId: elmwood.id, unitNumber: '1A', floor: 1, bedrooms: 1, bathrooms: 1, squareFeet: 680, rentAmount: 1850, depositAmount: 1850 } }),
    prisma.unit.create({ data: { propertyId: elmwood.id, unitNumber: '1B', floor: 1, bedrooms: 2, bathrooms: 1, squareFeet: 920, rentAmount: 2400, depositAmount: 2400 } }),
    prisma.unit.create({ data: { propertyId: elmwood.id, unitNumber: '2A', floor: 2, bedrooms: 1, bathrooms: 1, squareFeet: 680, rentAmount: 1900, depositAmount: 1900 } }),
    prisma.unit.create({ data: { propertyId: elmwood.id, unitNumber: '2B', floor: 2, bedrooms: 2, bathrooms: 2, squareFeet: 1050, rentAmount: 2650, depositAmount: 2650 } }),
    prisma.unit.create({ data: { propertyId: elmwood.id, unitNumber: '3A', floor: 3, bedrooms: 1, bathrooms: 1, squareFeet: 680, rentAmount: 1950, depositAmount: 1950, status: 'VACANT' } }),
    prisma.unit.create({ data: { propertyId: elmwood.id, unitNumber: '3B', floor: 3, bedrooms: 3, bathrooms: 2, squareFeet: 1300, rentAmount: 3100, depositAmount: 3100 } }),
  ])

  // ---- Units: Riverside (4 units) ----
  const riversideUnits = await Promise.all([
    prisma.unit.create({ data: { propertyId: riverside.id, unitNumber: '101', floor: 1, bedrooms: 2, bathrooms: 2, squareFeet: 1100, rentAmount: 2800, depositAmount: 2800 } }),
    prisma.unit.create({ data: { propertyId: riverside.id, unitNumber: '102', floor: 1, bedrooms: 2, bathrooms: 2, squareFeet: 1100, rentAmount: 2800, depositAmount: 2800 } }),
    prisma.unit.create({ data: { propertyId: riverside.id, unitNumber: '201', floor: 2, bedrooms: 3, bathrooms: 2, squareFeet: 1400, rentAmount: 3400, depositAmount: 3400 } }),
    prisma.unit.create({ data: { propertyId: riverside.id, unitNumber: '202', floor: 2, bedrooms: 3, bathrooms: 2, squareFeet: 1400, rentAmount: 3400, depositAmount: 3400, status: 'VACANT' } }),
  ])

  // ---- Units: Harbor (2 units) ----
  const harborUnits = await Promise.all([
    prisma.unit.create({ data: { propertyId: harbor.id, unitNumber: 'A', floor: 1, bedrooms: 2, bathrooms: 1, squareFeet: 950, rentAmount: 2200, depositAmount: 2200 } }),
    prisma.unit.create({ data: { propertyId: harbor.id, unitNumber: 'B', floor: 2, bedrooms: 2, bathrooms: 1, squareFeet: 950, rentAmount: 2250, depositAmount: 2250 } }),
  ])

  // ---- Tenants (10) ----
  const tenants = await Promise.all([
    prisma.user.create({ data: { email: 'priya.sharma@email.com', firstName: 'Priya', lastName: 'Sharma', role: 'TENANT', phone: '555-201-0001' } }),
    prisma.user.create({ data: { email: 'james.okafor@email.com', firstName: 'James', lastName: 'Okafor', role: 'TENANT', phone: '555-201-0002' } }),
    prisma.user.create({ data: { email: 'elena.vasquez@email.com', firstName: 'Elena', lastName: 'Vasquez', role: 'TENANT', phone: '555-201-0003' } }),
    prisma.user.create({ data: { email: 'tom.nguyen@email.com', firstName: 'Tom', lastName: 'Nguyen', role: 'TENANT', phone: '555-201-0004' } }),
    prisma.user.create({ data: { email: 'sarah.chen@email.com', firstName: 'Sarah', lastName: 'Chen', role: 'TENANT', phone: '555-201-0005' } }),
    prisma.user.create({ data: { email: 'david.kim@email.com', firstName: 'David', lastName: 'Kim', role: 'TENANT', phone: '555-201-0006' } }),
    prisma.user.create({ data: { email: 'maya.patel@email.com', firstName: 'Maya', lastName: 'Patel', role: 'TENANT', phone: '555-201-0007' } }),
    prisma.user.create({ data: { email: 'carlos.reyes@email.com', firstName: 'Carlos', lastName: 'Reyes', role: 'TENANT', phone: '555-201-0008' } }),
    prisma.user.create({ data: { email: 'lisa.park@email.com', firstName: 'Lisa', lastName: 'Park', role: 'TENANT', phone: '555-201-0009' } }),
    prisma.user.create({ data: { email: 'mike.torres@email.com', firstName: 'Mike', lastName: 'Torres', role: 'TENANT', phone: '555-201-0010' } }),
  ])

  // ---- Leases ----
  const now = new Date()
  const leaseAssignments = [
    { unit: elmwoodUnits[0], tenant: tenants[0], start: new Date('2024-02-01'), end: new Date('2025-01-31') }, // expiring soon
    { unit: elmwoodUnits[1], tenant: tenants[1], start: new Date('2024-06-01'), end: new Date('2025-05-31') },
    { unit: elmwoodUnits[2], tenant: tenants[2], start: new Date('2023-09-01'), end: new Date('2025-03-15') }, // expiring soon
    { unit: elmwoodUnits[3], tenant: tenants[3], start: new Date('2024-01-01'), end: new Date('2025-12-31') },
    // 3A is VACANT - no lease
    { unit: elmwoodUnits[5], tenant: tenants[4], start: new Date('2024-03-01'), end: new Date('2025-02-28') }, // expiring soon
    { unit: riversideUnits[0], tenant: tenants[5], start: new Date('2024-07-01'), end: new Date('2025-06-30') },
    { unit: riversideUnits[1], tenant: tenants[6], start: new Date('2024-08-01'), end: new Date('2025-07-31') },
    { unit: riversideUnits[2], tenant: tenants[7], start: new Date('2024-01-15'), end: new Date('2025-01-14') }, // expiring soon
    // 202 is VACANT
    { unit: harborUnits[0], tenant: tenants[8], start: new Date('2024-05-01'), end: new Date('2025-04-30') },
    { unit: harborUnits[1], tenant: tenants[9], start: new Date('2024-09-01'), end: new Date('2025-08-31') },
  ]

  const leases = await Promise.all(
    leaseAssignments.map(({ unit, tenant, start, end }) =>
      prisma.lease.create({
        data: {
          unitId: unit.id,
          tenantId: tenant.id,
          startDate: start,
          endDate: end,
          rentAmount: unit.rentAmount,
          depositPaid: unit.depositAmount,
          status: 'ACTIVE',
          documentUrl: `https://storage.dwella.app/leases/lease_${unit.unitNumber}.pdf`,
        },
      })
    )
  )

  // Update unit statuses
  const occupiedUnitIds = leaseAssignments.map(la => la.unit.id)
  await prisma.unit.updateMany({
    where: { id: { in: occupiedUnitIds } },
    data: { status: 'OCCUPIED' },
  })

  // ---- Payments (last 3 months + current) ----
  const paymentData: Array<{
    leaseId: string
    tenantId: string
    amount: number
    dueDate: Date
    paidDate: Date | null
    status: PaymentStatus
  }> = []

  const months = [-2, -1, 0] // 2 months ago, last month, this month

  for (let i = 0; i < leases.length; i++) {
    const lease = leases[i]
    const tenant = leaseAssignments[i].tenant

    for (const monthOffset of months) {
      const dueDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
      const isCurrentMonth = monthOffset === 0
      const isPastMonth = monthOffset < 0

      let status: PaymentStatus
      let paidDate: Date | null = null

      if (isPastMonth) {
        // Most tenants paid on time, a couple were late
        if (i === 2 && monthOffset === -1) {
          status = 'LATE'
          paidDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 18)
        } else {
          status = 'PAID'
          paidDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, Math.floor(Math.random() * 5) + 1)
        }
      } else {
        // Current month
        if (i === 4) {
          status = 'LATE' // one tenant is late this month
        } else if (i % 3 === 0) {
          status = 'PAID'
          paidDate = new Date(now.getFullYear(), now.getMonth(), 1)
        } else {
          status = 'DUE'
        }
      }

      paymentData.push({
        leaseId: lease.id,
        tenantId: tenant.id,
        amount: lease.rentAmount,
        dueDate,
        paidDate,
        status,
      })
    }
  }

  await prisma.payment.createMany({ data: paymentData })

  // ---- Applications (pending screening) ----
  await prisma.application.createMany({
    data: [
      {
        unitId: elmwoodUnits[4].id, // 3A vacant
        applicantName: 'Jordan Bell',
        applicantEmail: 'jordan.bell@email.com',
        applicantPhone: '555-300-0001',
        monthlyIncome: 7200,
        creditScore: 748,
        aiScore: 88,
        aiSummary: 'Jordan Bell reports income of $7,200/mo and a credit score of 748. Strong applicant with excellent credit and income well above the 3x rent threshold. Low risk profile. AI screening score: 88/100.',
        status: 'PENDING',
      },
      {
        unitId: elmwoodUnits[4].id,
        applicantName: 'Asha Patel',
        applicantEmail: 'asha.patel@email.com',
        applicantPhone: '555-300-0002',
        monthlyIncome: 5100,
        creditScore: 691,
        aiScore: 67,
        aiSummary: 'Asha Patel reports income of $5,100/mo and a credit score of 691. Moderate applicant — income meets the 3x threshold but credit score is below preferred range. Recommend verifying employment and references. AI screening score: 67/100.',
        status: 'PENDING',
      },
      {
        unitId: riversideUnits[3].id, // 202 vacant
        applicantName: 'Derek Walsh',
        applicantEmail: 'derek.walsh@email.com',
        applicantPhone: '555-300-0003',
        monthlyIncome: 9500,
        creditScore: 782,
        aiScore: 95,
        aiSummary: 'Derek Walsh reports income of $9,500/mo and a credit score of 782. Exceptional applicant — top-tier credit and strong income. Highly recommended. AI screening score: 95/100.',
        status: 'PENDING',
      },
      {
        unitId: riversideUnits[3].id,
        applicantName: 'Keisha Monroe',
        applicantEmail: 'keisha.monroe@email.com',
        applicantPhone: '555-300-0004',
        monthlyIncome: 4200,
        creditScore: 630,
        aiScore: 48,
        aiSummary: 'Keisha Monroe reports income of $4,200/mo and a credit score of 630. Higher-risk applicant — income is slightly below the preferred 3x threshold for this unit and credit score is below average. Recommend requiring a co-signer or larger deposit. AI screening score: 48/100.',
        status: 'PENDING',
      },
    ],
  })

  // ---- Maintenance Requests ----
  await prisma.maintenanceRequest.createMany({
    data: [
      {
        unitId: elmwoodUnits[1].id,
        tenantId: tenants[1].id,
        title: 'Leaking kitchen faucet',
        description: 'The kitchen faucet has been dripping constantly for the past week.',
        priority: 'MEDIUM',
        status: 'OPEN',
      },
      {
        unitId: riversideUnits[0].id,
        tenantId: tenants[5].id,
        title: 'HVAC not cooling properly',
        description: 'AC unit is running but not cooling the apartment below 78°F even at max.',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
      },
      {
        unitId: elmwoodUnits[3].id,
        tenantId: tenants[3].id,
        title: 'Bathroom light fixture flickering',
        description: 'The overhead light in the main bathroom flickers and sometimes shuts off.',
        priority: 'LOW',
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    ],
  })

  console.log(`Seeded:
  - 1 landlord (Marcus Holt)
  - 3 properties (The Elmwood, Riverside Commons, Harbor View)
  - 12 units (2 vacant)
  - 10 tenants
  - 10 active leases
  - ${paymentData.length} payment records
  - 4 pending applications
  - 3 maintenance requests`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
