import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'

export const propertiesRouter = Router()

async function getLandlordId(clerkId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  return user?.id ?? null
}

// GET /api/properties
propertiesRouter.get('/', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const landlordId = await getLandlordId(authReq.auth.userId)
    if (!landlordId) return res.status(401).json({ error: 'Unauthorized' })

    const properties = await prisma.property.findMany({
      where: { landlordId },
      include: {
        units: {
          select: { id: true, unitNumber: true, status: true, rentAmount: true, bedrooms: true, bathrooms: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(properties)
  } catch {
    res.status(500).json({ error: 'Failed to fetch properties' })
  }
})

// GET /api/properties/:id
propertiesRouter.get('/:id', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const landlordId = await getLandlordId(authReq.auth.userId)
    if (!landlordId) return res.status(401).json({ error: 'Unauthorized' })

    const property = await prisma.property.findFirst({
      where: { id: req.params.id, landlordId },
      include: {
        units: {
          include: {
            leases: {
              where: { status: 'ACTIVE' },
              include: { tenant: { select: { id: true, firstName: true, lastName: true, email: true } } },
            },
          },
        },
      },
    })
    if (!property) return res.status(404).json({ error: 'Property not found' })
    res.json(property)
  } catch {
    res.status(500).json({ error: 'Failed to fetch property' })
  }
})

// POST /api/properties
propertiesRouter.post('/', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const landlordId = await getLandlordId(authReq.auth.userId)
    if (!landlordId) return res.status(401).json({ error: 'Unauthorized' })

    const { name, address, city, state, zip, description, portfolioId } = req.body
    const property = await prisma.property.create({
      data: { name, address, city, state, zip, description, landlordId, portfolioId: portfolioId || null },
      include: { units: true },
    })
    res.status(201).json(property)
  } catch {
    res.status(500).json({ error: 'Failed to create property' })
  }
})

// PATCH /api/properties/:id
propertiesRouter.patch('/:id', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const landlordId = await getLandlordId(authReq.auth.userId)
    if (!landlordId) return res.status(401).json({ error: 'Unauthorized' })

    const { name, address, city, state, zip, description, portfolioId } = req.body
    const property = await prisma.property.updateMany({
      where: { id: req.params.id, landlordId },
      data: {
        ...(name !== undefined && { name }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(zip !== undefined && { zip }),
        ...(description !== undefined && { description }),
        ...('portfolioId' in req.body && { portfolioId: portfolioId || null }),
      },
    })
    if (!property.count) return res.status(404).json({ error: 'Property not found' })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Failed to update property' })
  }
})

// DELETE /api/properties/:id
propertiesRouter.delete('/:id', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const landlordId = await getLandlordId(authReq.auth.userId)
    if (!landlordId) return res.status(401).json({ error: 'Unauthorized' })

    await prisma.property.deleteMany({ where: { id: req.params.id, landlordId } })
    res.status(204).send()
  } catch {
    res.status(500).json({ error: 'Failed to delete property' })
  }
})
