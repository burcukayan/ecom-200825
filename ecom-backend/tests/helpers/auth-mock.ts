import { NextFunction, Request, Response } from 'express'
import { UnauthorizedError } from 'express-oauth2-jwt-bearer'

const actual = jest.requireActual('../../src/middlewares/auth')
export const requireRole = actual.requireRole

const NS = 'https://ecom-200825.com/'

const TEST_USERS: Record<string, Record<string, unknown>> = {
  admin: { sub: 'auth0|admin', [`${NS}email`]: 'admin@test.local', [`${NS}roles`]: ['admin'] },
  customer: { sub: 'auth0|customer', [`${NS}email`]: 'customer@test.local', [`${NS}roles`]: [] },
}

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace(/^Bearer /, '')
  const payload = token ? TEST_USERS[token] : undefined
  if (!payload) return next(new UnauthorizedError())

  req.auth = { payload, header: {}, token } as unknown as Request['auth']
  next()
}
