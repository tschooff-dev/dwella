import { Router } from 'express'
import { prisma } from '../lib/prisma'

export const unitsRouter = Router()

// GET /api/units
unitsRouter.get('/', async (req, res) => {
  try {
    const { propertyId, status } = req.query
    const units = await prisma.unit.findMany({
      where: {
        ...(propertyId ? { propertyId: String(propertyId) } : {}),
        ...(status ? { status: String(status) as any } : {}),
      },
      include: {
        property: { select: { id: true, name: true, address: true } },
        leases: {
          where: { status: 'ACTIVE' },
          include: {
            tenant: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
      orderBy: [{ property: { name: 'asc' } }, { unitNumber: 'asc' }],
    })
    res.json(units)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch units' })
  }
})

// GET /api/units/:id
unitsRouter.get('/:id', async (req, res) => {
  try {
    const unit = await prisma.unit.findUnique({
      where: { id: req.params.id },
      include: {
        property: true,
        leases: {
          include: {
            tenant: true,
            payments: { orderBy: { dueDate: 'desc' }, take: 12 },
          },
        },
        maintenanceRequests: { orderBy: { createdAt: 'desc' } },
        applications: { where: { status: 'PENDING' } },
      },
    })
    if (!unit) return res.status(404).json({ error: 'Unit not found' })
    res.json(unit)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch unit' })
  }
})

// POST /api/units
unitsRouter.post('/', async (req, res) => {
  try {
    const { propertyId, unitNumber, floor, bedrooms, bathrooms, squareFeet, rentAmount, depositAmount } = req.body
    const unit = await prisma.unit.create({
      data: { propertyId, unitNumber, floor, bedrooms, bathrooms, squareFeet, rentAmount, depositAmount },
    })
    res.status(201).json(unit)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create unit' })
  }
})

// PATCH /api/units/:id
unitsRouter.patch('/:id', async (req, res) => {
  try {
    const unit = await prisma.unit.update({
      where: { id: req.params.id },
      data: req.body,
    })
    res.json(unit)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update unit' })
  }
})
