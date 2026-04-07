import { Router } from 'express'
import { prisma } from '../lib/prisma'

export const tenantsRouter = Router()

// GET /api/tenants
tenantsRouter.get('/', async (_req, res) => {
  try {
    const tenants = await prisma.user.findMany({
      where: { role: 'TENANT' },
      include: {
        leases: {
          where: { status: 'ACTIVE' },
          include: {
            unit: {
              include: { property: { select: { id: true, name: true } } },
            },
          },
        },
        payments: {
          orderBy: { dueDate: 'desc' },
          take: 3,
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
tenantsRouter.get('/:id', async (req, res) => {
  try {
    const tenant = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        leases: {
          include: {
            unit: { include: { property: true } },
            payments: { orderBy: { dueDate: 'desc' } },
          },
        },
        maintenanceRequests: {
          orderBy: { createdAt: 'desc' },
          include: { unit: { select: { unitNumber: true } } },
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
