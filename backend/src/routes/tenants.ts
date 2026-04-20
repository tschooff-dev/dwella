import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'

export const tenantsRouter = Router()

// GET /api/tenants — tenants with active leases on the current landlord's properties
tenantsRouter.get('/', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const landlord = await prisma.user.findUnique({
      where: { clerkId: authReq.auth.userId },
      select: { id: true },
    })
    if (!landlord) return res.status(401).json({ error: 'Unauthorized' })

    const tenants = await prisma.user.findMany({
      where: {
        role: 'TENANT',
        leases: {
          some: {
            unit: { property: { landlordId: landlord.id } },
          },
        },
      },
      include: {
        leases: {
          where: {
            unit: { property: { landlordId: landlord.id } },
          },
          include: {
            unit: {
              include: { property: { select: { id: true, name: true } } },
            },
            payments: {
              orderBy: { dueDate: 'desc' },
              take: 1,
            },
          },
          orderBy: { startDate: 'desc' },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    })
    res.json(tenants)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tenants' })
  }
})

// GET /api/tenants/:id
tenantsRouter.get('/:id', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const landlord = await prisma.user.findUnique({
      where: { clerkId: authReq.auth.userId },
      select: { id: true },
    })
    if (!landlord) return res.status(401).json({ error: 'Unauthorized' })

    const tenant = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        leases: {
          where: { unit: { property: { landlordId: landlord.id } } },
          include: {
            unit: { include: { property: { select: { id: true, name: true, address: true } } } },
            payments: { orderBy: { dueDate: 'desc' }, take: 12 },
          },
          orderBy: { startDate: 'desc' },
        },
        maintenanceRequests: {
          where: { unit: { property: { landlordId: landlord.id } } },
          orderBy: { createdAt: 'desc' },
          include: { unit: { select: { unitNumber: true, property: { select: { name: true } } } } },
        },
      },
    })
    if (!tenant || tenant.role !== 'TENANT') {
      return res.status(404).json({ error: 'Tenant not found' })
    }
    res.json(tenant)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tenant' })
  }
})

// POST /api/tenants — create a tenant user + lease in one shot
tenantsRouter.post('/', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const landlord = await prisma.user.findUnique({
      where: { clerkId: authReq.auth.userId },
      select: { id: true },
    })
    if (!landlord) return res.status(401).json({ error: 'Unauthorized' })

    const { firstName, lastName, email, phone, unitId, startDate, endDate, rentAmount, depositPaid } = req.body

    // Verify the unit belongs to this landlord
    const unit = await prisma.unit.findFirst({
      where: { id: unitId, property: { landlordId: landlord.id } },
    })
    if (!unit) return res.status(403).json({ error: 'Unit not found or not owned by you' })

    // Upsert tenant user (they may not have a Clerk account yet)
    const tenant = await prisma.user.upsert({
      where: { email },
      update: { firstName, lastName, phone: phone ?? null, role: 'TENANT' },
      create: { email, firstName, lastName, phone: phone ?? null, role: 'TENANT' },
    })

    // Create lease
    const lease = await prisma.lease.create({
      data: {
        unitId,
        tenantId: tenant.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        rentAmount: Number(rentAmount),
        depositPaid: depositPaid ? Number(depositPaid) : null,
        status: 'ACTIVE',
      },
      include: {
        unit: { include: { property: { select: { id: true, name: true } } } },
      },
    })

    // Mark unit as occupied
    await prisma.unit.update({ where: { id: unitId }, data: { status: 'OCCUPIED' } })

    res.status(201).json({ tenant, lease })
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'A tenant with that email already has a lease' })
    res.status(500).json({ error: 'Failed to create tenant' })
  }
})
