import { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../common/prisma'

const testOrderSchema = z.object({
  description: z.string().min(1, 'Description is required'),
})

async function testOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const data = testOrderSchema.parse(req.body)
    const order = await prisma.testOrder.create({ data })
    res.status(201).json({ order })
  } catch (error) {
    next(error)
  }
}

export default { testOrder }
