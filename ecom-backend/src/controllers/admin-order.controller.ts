import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import Stripe from 'stripe'
import { prisma } from '../common/prisma'
import type { OrderStatus } from '../../prisma/generated/prisma/client'
import emailService from '../services/email/service'
import orderService, { OrderNotCancellableError, OrderNotFoundError } from '../services/orders/service'

const isObjectId = (value: string) => /^[a-f\d]{24}$/i.test(value)

const adminOrderSelect = {
  id: true,
  status: true,
  totalCents: true,
  currency: true,
  createdAt: true,
  carrier: true,
  trackingNumber: true,
  user: { select: { name: true, email: true } },
  orderItems: {
    select: { id: true, name: true, quantity: true, priceCents: true, currency: true },
  },
} as const

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [],
  PAID: ['SHIPPING'],
  SHIPPING: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
}

const CARRIERS = [
  'Yurtiçi Kargo',
  'Aras Kargo',
  'MNG Kargo',
  'PTT Kargo',
  'Sürat Kargo',
  'UPS',
  'DHL',
  'Other',
] as const

const updateStatusSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('SHIPPING'),
    carrier: z.enum(CARRIERS),
    trackingNumber: z
      .string()
      .trim()
      .min(5, 'Tracking number must be at least 5 characters.')
      .max(40, 'Tracking number must be at most 40 characters.')
      .regex(/^[A-Za-z0-9-]+$/, 'Tracking number may only contain letters, numbers and dashes.'),
  }),
  z.object({ status: z.literal('COMPLETED') }),
])

export const listOrders = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: adminOrderSelect,
    })
    res.status(200).json(orders)
  } catch (error) {
    next(error)
  }
}

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    if (!id || !isObjectId(id)) return res.status(404).json({ error: 'Order not found.' })

    const body = updateStatusSchema.parse(req.body)
    const { status } = body

    const order = await prisma.order.findUnique({ where: { id }, select: { status: true } })
    if (!order) return res.status(404).json({ error: 'Order not found.' })

    if (!ALLOWED_TRANSITIONS[order.status].includes(status)) {
      return res.status(409).json({ error: `Cannot change status from ${order.status} to ${status}.` })
    }

    const updated = await prisma.order.update({
      where: { id },
      data:
        body.status === 'SHIPPING'
          ? { status, shippedAt: new Date(), carrier: body.carrier, trackingNumber: body.trackingNumber }
          : { status, completedAt: new Date() },
      select: adminOrderSelect,
    })
    if (status === 'SHIPPING') void emailService.sendOrderShippedEmail(id)
    res.status(200).json(updated)
  } catch (error) {
    next(error)
  }
}

export const cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    if (!id || !isObjectId(id)) return res.status(404).json({ error: 'Order not found.' })

    await orderService.cancelAndRefund(id)

    const updated = await prisma.order.findUnique({ where: { id }, select: adminOrderSelect })
    res.status(200).json(updated)
  } catch (error) {
    if (error instanceof OrderNotFoundError) return res.status(404).json({ error: error.message })
    if (error instanceof OrderNotCancellableError) return res.status(409).json({ error: error.message })
    if (error instanceof Stripe.errors.StripeError) return res.status(502).json({ error: error.message })
    next(error)
  }
}
