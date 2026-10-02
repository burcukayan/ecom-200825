import { Request, Response, NextFunction } from 'express'
import Stripe from 'stripe'
import { prisma } from '../common/prisma'
import { stripe } from '../common/stripe'
import logger from '../common/logger'
import orderService, { OrderNotCancellableError, OrderNotFoundError } from '../services/orders/service'

const isObjectId = (value: string) => /^[a-f\d]{24}$/i.test(value)

export const getMyOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(404).json({ error: 'User not found.' })

    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        status: true,
        totalCents: true,
        currency: true,
        createdAt: true,
        orderItems: {
          select: {
            id: true,
            name: true,
            quantity: true,
            priceCents: true,
            currency: true,
            productId: true,
            product: { select: { imageUrls: true } },
          },
        },
      },
    })

    res.status(200).json(orders)
  } catch (error) {
    next(error)
  }
}

const orderDetailSelect = {
  id: true,
  status: true,
  totalCents: true,
  currency: true,
  email: true,
  shippingAddress: true,
  carrier: true,
  trackingNumber: true,
  stripeSessionId: true,
  stripeRefundId: true,
  createdAt: true,
  shippedAt: true,
  completedAt: true,
  cancelledAt: true,
  orderItems: {
    select: {
      id: true,
      name: true,
      quantity: true,
      priceCents: true,
      currency: true,
      productId: true,
      product: { select: { imageUrls: true, isActive: true } },
    },
  },
} as const

async function getReceiptUrl(sessionId: string): Promise<string | null> {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent.latest_charge'],
    })
    const paymentIntent = session.payment_intent
    if (!paymentIntent || typeof paymentIntent === 'string') return null
    const charge = paymentIntent.latest_charge
    if (!charge || typeof charge === 'string') return null
    return charge.receipt_url ?? null
  } catch (err) {
    logger.warn({ err, sessionId }, 'Could not load Stripe receipt URL')
    return null
  }
}

async function findMyOrder(orderId: string, userId: string) {
  if (!isObjectId(orderId)) return null
  return prisma.order.findFirst({ where: { id: orderId, userId }, select: orderDetailSelect })
}

async function toOrderDetail(order: NonNullable<Awaited<ReturnType<typeof findMyOrder>>>) {
  const { stripeSessionId, stripeRefundId, ...rest } = order
  return {
    ...rest,
    refunded: Boolean(stripeRefundId),
    receiptUrl: await getReceiptUrl(stripeSessionId),
  }
}

export const getMyOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(404).json({ error: 'User not found.' })

    const order = await findMyOrder(req.params.id ?? '', req.user.id)
    if (!order) return res.status(404).json({ error: 'Order not found.' })

    res.status(200).json(await toOrderDetail(order))
  } catch (error) {
    next(error)
  }
}

export const cancelMyOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(404).json({ error: 'User not found.' })

    const order = await findMyOrder(req.params.id ?? '', req.user.id)
    if (!order) return res.status(404).json({ error: 'Order not found.' })

    await orderService.cancelAndRefund(order.id)

    const updated = await findMyOrder(order.id, req.user.id)
    res.status(200).json(updated ? await toOrderDetail(updated) : null)
  } catch (error) {
    if (error instanceof OrderNotFoundError) return res.status(404).json({ error: error.message })
    if (error instanceof OrderNotCancellableError) {
      return res.status(409).json({ error: 'This order can no longer be cancelled.' })
    }
    if (error instanceof Stripe.errors.StripeError) {
      logger.error({ err: error, orderId: req.params.id }, 'Customer cancel: Stripe refund failed')
      return res.status(502).json({ error: 'Refund could not be processed. Please try again later.' })
    }
    next(error)
  }
}
