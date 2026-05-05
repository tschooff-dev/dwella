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
    const clerkId = authReq.auth.userId
    const fields = { firstName, lastName, phone: phone ?? null, role }

    // Look up by clerkId first, then by email
    let existing = await prisma.user.findUnique({ where: { clerkId } })
    if (!existing && email) {
      const byEmail = await prisma.user.findUnique({ where: { email } })
      if (byEmail) {
        return res.status(409).json({ error: 'account_exists' })
      }
    }

    let user
    if (existing) {
      user = await prisma.user.update({
        where: { id: existing.id },
        data: { ...fields, clerkId, email: email || existing.email },
      })
    } else {
      user = await prisma.user.create({
        data: { clerkId, email, ...fields },
      })
    }

    res.json(user)
  } catch (err) {
    console.error('Setup error:', err)
    res.status(500).json({ error: 'Failed to save profile' })
  }
})
