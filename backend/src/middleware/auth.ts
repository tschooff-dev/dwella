import { ClerkExpressRequireAuth, RequireAuthProp } from '@clerk/clerk-sdk-node'
import { Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'

export type AuthenticatedRequest = RequireAuthProp<Request>

export const requireAuth = ClerkExpressRequireAuth()

export async function requireLandlord(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const clerkId = req.auth.userId
  if (!clerkId) return res.status(401).json({ error: 'Unauthorized' })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { role: true } })
  if (!user || user.role !== 'LANDLORD') return res.status(403).json({ error: 'Forbidden' })

  next()
}

export async function requireTenant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const clerkId = req.auth.userId
  if (!clerkId) return res.status(401).json({ error: 'Unauthorized' })

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { role: true } })
  if (!user || user.role !== 'TENANT') return res.status(403).json({ error: 'Forbidden' })

  next()
}
