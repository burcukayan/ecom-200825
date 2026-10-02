import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '../common/prisma'

const emptyToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v)

const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name should be at least 2 characters.').optional(),
  address: z.preprocess(
    emptyToNull,
    z.string().trim().min(10, 'Address must be at least 10 characters.').nullable().optional(),
  ),
})

const publicUserSelect = {
  id: true,
  email: true,
  emailVerified: true,
  name: true,
  picture: true,
  address: true,
  role: true,
} as const

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(404).json({ error: 'User not found.' })

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: publicUserSelect,
    })
    res.status(200).json(user)
  } catch (error) {
    next(error)
  }
}

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(404).json({ error: 'User not found.' })

    const data = updateProfileSchema.parse(req.body)

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: publicUserSelect,
    })
    res.status(200).json(updatedUser)
  } catch (error) {
    next(error)
  }
}
