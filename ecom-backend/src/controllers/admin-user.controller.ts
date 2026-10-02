import { Request, Response, NextFunction } from 'express'
import { prisma } from '../common/prisma'

export const listUsers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        email: true,
        emailVerified: true,
        name: true,
        picture: true,
        address: true,
        role: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    })

    res.status(200).json(users.map(({ _count, ...user }) => ({ ...user, orderCount: _count.orders })))
  } catch (error) {
    next(error)
  }
}
