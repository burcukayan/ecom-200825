import { NextFunction, Request, Response } from 'express'
import { auth } from 'express-oauth2-jwt-bearer'
import { env } from '../common/env'

export const requireAuth = auth({
  audience: env.AUTH0_AUDIENCE,
  issuerBaseURL: env.AUTH0_ISSUER_BASE_URL,
  tokenSigningAlg: 'RS256',
})

const ROLES_CLAIM = `${env.AUTH0_NAMESPACE}roles`

export const requireRole = (role: 'admin') => (req: Request, res: Response, next: NextFunction) => {
  const roles = req.auth?.payload?.[ROLES_CLAIM]
  if (Array.isArray(roles) && roles.includes(role)) return next()
  return res.status(403).json({ error: 'Forbidden' })
}
