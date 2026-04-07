import { Router } from 'express'
import { prisma } from '../lib/prisma'

export const propertiesRouter = Router()

// GET /api/properties
propertiesRouter.get('/', async (_req, res) => {
  try {
    const properties = await prisma.property.findMany({
      include: {
        units: {
          select: {
            id: true,
            unitNumber: true,
            status: true,
            rentAmount: true,
            bedrooms: true,
            bathrooms: true,
          },
        },
        _count: { select: { units: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(properties)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch properties' })
  }
})

// GET /api/properties/:id
propertiesRouter.get('/:id', async (req, res) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
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
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch property' })
  }
})

// POST /api/properties
propertiesRouter.post('/', async (req, res) => {
  try {
    const { name, address, city, state, zip, description, landlordId } = req.body
    const property = await prisma.property.create({
      data: { name, address, city, state, zip, description, landlordId },
    })
    res.status(201).json(property)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create property' })
  }
})

// PATCH /api/properties/:id
propertiesRouter.patch('/:id', async (req, res) => {
  try {
    const property = await prisma.property.update({
      where: { id: req.params.id },
      data: req.body,
    })
    res.json(property)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update property' })
  }
})

// DELETE /api/properties/:id
propertiesRouter.delete('/:id', async (req, res) => {
  try {
    await prisma.property.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete property' })
  }
})
