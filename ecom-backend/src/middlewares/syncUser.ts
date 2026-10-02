import { Request, Response, NextFunction } from 'express'
import { Prisma, type Role } from '../../prisma/generated/prisma/client'
import { prisma } from '../common/prisma'
import { env } from '../common/env'
import logger from '../common/logger'

const NS = env.AUTH0_NAMESPACE

export const syncUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.auth?.payload
    const auth0Id = payload?.sub

    if (!auth0Id) {
      return res.status(401).json({ error: 'Invalid token: user ID not found' })
    }

    const email = payload?.[`${NS}email`] as string | undefined
    const emailVerified = payload?.[`${NS}email_verified`] === true
    const roles = payload?.[`${NS}roles`]
    const role: Role = Array.isArray(roles) && roles.includes('admin') ? 'ADMIN' : 'CUSTOMER'

    if (!email) {
      logger.error({ auth0Id }, 'Email claim missing in access token. Is the Auth0 Action attached to the Login flow?')
      return res.status(401).json({ error: 'Unable to find email claim in token' })
    }

    let user = await prisma.user.findUnique({ where: { auth0Id } })

    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            auth0Id,
            email,
            emailVerified,
            role,
            name: payload?.[`${NS}name`] as string | undefined,
            picture: payload?.[`${NS}picture`] as string | undefined,
          },
        })
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          user = await prisma.user.findUniqueOrThrow({ where: { auth0Id } })
        } else {
          throw err
        }
      }
    } else if (user.email !== email || user.emailVerified !== emailVerified || user.role !== role) {
      user = await prisma.user.update({
        where: { auth0Id },
        data: { email, emailVerified, role },
      })
    }

    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}
