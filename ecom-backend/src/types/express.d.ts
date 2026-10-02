import type { User } from '../../prisma/generated/prisma/client'

declare global {
  namespace Express {
    interface Request {
      user?: User
    }
  }
}

export {}
