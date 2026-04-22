import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'

export const messagesRouter = Router()

async function getLandlordId(clerkId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  return user?.id ?? null
}

// GET /api/messages/conversations — all lease threads for this landlord
messagesRouter.get('/conversations', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const landlordId = await getLandlordId(authReq.auth.userId)
    if (!landlordId) return res.status(401).json({ error: 'Unauthorized' })

    const leases = await prisma.lease.findMany({
      where: { unit: { property: { landlordId } }, status: 'ACTIVE' },
      include: {
        tenant: { select: { id: true, firstName: true, lastName: true, email: true } },
        unit: { include: { property: { select: { name: true } } } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: { firstName: true, role: true } } },
        },
      },
    })

    // Count unread per lease (sent by tenant, not read)
    const conversations = await Promise.all(leases.map(async lease => {
      const unread = await prisma.message.count({
        where: { leaseId: lease.id, sender: { role: 'TENANT' }, readAt: null },
      })
      return {
        leaseId: lease.id,
        tenant: lease.tenant,
        unit: { number: lease.unit.unitNumber, property: lease.unit.property.name },
        lastMessage: lease.messages[0] ?? null,
        unread,
      }
    }))

    res.json(conversations.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0
      const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0
      return bTime - aTime
    }))
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversations' })
  }
})

// GET /api/messages/:leaseId — get messages for a specific lease
messagesRouter.get('/:leaseId', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const landlordId = await getLandlordId(authReq.auth.userId)
    if (!landlordId) return res.status(401).json({ error: 'Unauthorized' })

    const lease = await prisma.lease.findFirst({
      where: { id: req.params.leaseId, unit: { property: { landlordId } } },
    })
    if (!lease) return res.status(404).json({ error: 'Lease not found' })

    const messages = await prisma.message.findMany({
      where: { leaseId: req.params.leaseId },
      include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    })

    // Mark tenant messages as read
    await prisma.message.updateMany({
      where: { leaseId: req.params.leaseId, sender: { role: 'TENANT' }, readAt: null },
      data: { readAt: new Date() },
    })

    res.json(messages)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

// POST /api/messages/:leaseId — landlord sends a message
messagesRouter.post('/:leaseId', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const landlordId = await getLandlordId(authReq.auth.userId)
    if (!landlordId) return res.status(401).json({ error: 'Unauthorized' })

    const lease = await prisma.lease.findFirst({
      where: { id: req.params.leaseId, unit: { property: { landlordId } } },
    })
    if (!lease) return res.status(404).json({ error: 'Lease not found' })

    const { body } = req.body
    if (!body?.trim()) return res.status(400).json({ error: 'body is required' })

    const message = await prisma.message.create({
      data: { leaseId: req.params.leaseId, senderId: landlordId, body: body.trim() },
      include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
    })
    res.status(201).json(message)
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' })
  }
})

// GET /api/messages/unread-total — total unread for landlord badge
messagesRouter.get('/meta/unread-total', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const landlordId = await getLandlordId(authReq.auth.userId)
    if (!landlordId) return res.json({ count: 0 })

    const count = await prisma.message.count({
      where: {
        lease: { unit: { property: { landlordId } } },
        sender: { role: 'TENANT' },
        readAt: null,
      },
    })
    res.json({ count })
  } catch (err) {
    res.json({ count: 0 })
  }
})
