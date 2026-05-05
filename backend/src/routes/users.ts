import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth'

export const usersRouter = Router()

// GET /api/users/me — returns the current user's DB record, or null if not set up
usersRouter.get('/me', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: authReq.auth.userId },
    })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

// POST /api/users/setup — create or complete profile setup
usersRouter.post('/setup', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest
  const { firstName, lastName, phone, role } = req.body

  if (!firstName || !lastName || !role) {
    return res.status(400).json({ error: 'firstName, lastName, and role are required' })
  }
  if (role !== 'LANDLORD' && role !== 'TENANT') {
    return res.status(400).json({ error: 'role must be LANDLORD or TENANT' })
  }

  try {
    const email = req.body.email ?? ''
    const updateData = { firstName, lastName, phone: phone ?? null, role, clerkId: authReq.auth.userId }

    // Try upsert by clerkId first; if a duplicate email blocks the create,
    // fall back to finding the existing record by email and updating it.
    let user
    try {
      user = await prisma.user.upsert({
        where: { clerkId: authReq.auth.userId },
        update: { firstName, lastName, phone: phone ?? null, role },
        create: { clerkId: authReq.auth.userId, email, ...updateData },
      })
    } catch (upsertErr: any) {
      if (upsertErr?.code === 'P2002') {
        user = await prisma.user.update({
          where: { email },
          data: updateData,
        })
      } else {
        throw upsertErr
      }
    }

    res.json(user)
  } catch (err) {
    res.status(500).json({ error: 'Failed to save profile' })
  }
})
