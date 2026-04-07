import { Request, Response, NextFunction } from 'express'

/**
 * Clerk auth middleware placeholder.
 *
 * To enable real auth:
 * 1. npm install @clerk/clerk-sdk-node
 * 2. Replace this middleware with:
 *    import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node'
 *    export const requireAuth = ClerkExpressRequireAuth()
 *
 * The Clerk SDK will verify the session token from the Authorization header
 * and attach the auth object to req.auth.
 */

export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string
    sessionId: string
  }
}

/**
 * Placeholder middleware — allows all requests through in development.
 * Replace with real Clerk middleware before going to production.
 */
export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  // TODO: Replace with Clerk auth
  // In dev, attach a mock user so routes work without a real session
  req.auth = {
    userId: 'dev_user_landlord',
    sessionId: 'dev_session',
  }
  next()
}

/**
 * Require landlord role.
 * Extend once real auth is in place to check the user's role from the database.
 */
export function requireLandlord(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // TODO: check req.auth.userId against DB to verify LANDLORD role
  next()
}

/**
 * Require tenant role.
 */
export function requireTenant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // TODO: check req.auth.userId against DB to verify TENANT role
  next()
}
