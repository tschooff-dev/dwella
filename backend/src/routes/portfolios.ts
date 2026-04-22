import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'

export const portfoliosRouter = Router()

async function getLandlordId(clerkId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  return user?.id ?? null
}

// GET /api/portfolios
portfoliosRouter.get('/', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const landlordId = await getLandlordId(authReq.auth.userId)
    if (!landlordId) return res.status(401).json({ error: 'Unauthorized' })

    const portfolios = await prisma.portfolio.findMany({
      where: { landlordId },
      orderBy: { createdAt: 'asc' },
    })
    res.json(portfolios)
  } catch {
    res.status(500).json({ error: 'Failed to fetch portfolios' })
  }
})

// POST /api/portfolios
portfoliosRouter.post('/', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const landlordId = await getLandlordId(authReq.auth.userId)
    if (!landlordId) return res.status(401).json({ error: 'Unauthorized' })

    const { name, color = 'indigo' } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'name is required' })

    const portfolio = await prisma.portfolio.create({
      data: { name: name.trim(), color, landlordId },
    })
    res.status(201).json(portfolio)
  } catch {
    res.status(500).json({ error: 'Failed to create portfolio' })
  }
})

// PATCH /api/portfolios/:id
portfoliosRouter.patch('/:id', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const landlordId = await getLandlordId(authReq.auth.userId)
    if (!landlordId) return res.status(401).json({ error: 'Unauthorized' })

    const { name, color } = req.body
    const result = await prisma.portfolio.updateMany({
      where: { id: req.params.id, landlordId },
      data: {
        ...(name?.trim() && { name: name.trim() }),
        ...(color && { color }),
      },
    })
    if (!result.count) return res.status(404).json({ error: 'Portfolio not found' })
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Failed to update portfolio' })
  }
})

// DELETE /api/portfolios/:id
portfoliosRouter.delete('/:id', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const landlordId = await getLandlordId(authReq.auth.userId)
    if (!landlordId) return res.status(401).json({ error: 'Unauthorized' })

    // Unassign properties before deleting
    await prisma.property.updateMany({
      where: { portfolioId: req.params.id, landlordId },
      data: { portfolioId: null },
    })
    await prisma.portfolio.deleteMany({ where: { id: req.params.id, landlordId } })
    res.status(204).send()
  } catch {
    res.status(500).json({ error: 'Failed to delete portfolio' })
  }
})
