import Stripe from 'stripe'
import { prisma } from '../../common/prisma'
import { stripe } from '../../common/stripe'
import logger from '../../common/logger'
import emailService from '../email/service'
import type { OrderStatus } from '../../../prisma/generated/prisma/client'

export class OrderNotFoundError extends Error {}
export class OrderNotCancellableError extends Error {}

type CancellableOrder = {
  id: string
  status: OrderStatus
  orderItems: { productId: string; quantity: number }[]
}

const cancellableOrderSelect = {
  id: true,
  status: true,
  stripeSessionId: true,
  orderItems: { select: { productId: true, quantity: true } },
} as const

async function applyCancellation(order: CancellableOrder, refundId: string | null) {
  const restock = order.status === 'PAID'

  const cancelled = await prisma.$transaction(async (tx) => {
    const result = await tx.order.updateMany({
      where: { id: order.id, status: order.status },
      data: { status: 'CANCELLED', stripeRefundId: refundId, cancelledAt: new Date() },
    })
    if (result.count === 0) return false

    if (restock) {
      for (const item of order.orderItems) {
        await tx.product.updateMany({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      }
    }
    return true
  })

  if (cancelled) void emailService.sendOrderCancelledEmail(order.id)
}

async function cancelAndRefund(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: cancellableOrderSelect })

  if (!order) throw new OrderNotFoundError('Order not found.')
  if (order.status !== 'PAID') {
    throw new OrderNotCancellableError(`Only paid orders can be cancelled (current status: ${order.status}).`)
  }

  const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId)
  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id
  if (!paymentIntentId) throw new Error(`Session ${order.stripeSessionId} has no payment_intent`)

  const refund = await stripe.refunds.create(
    { payment_intent: paymentIntentId, reason: 'requested_by_customer', metadata: { orderId: order.id } },
    { idempotencyKey: `refund-order-${order.id}` },
  )

  await applyCancellation(order, refund.id)
  logger.info({ orderId: order.id, refundId: refund.id, refundStatus: refund.status }, 'Order cancelled and refunded')
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  if (!charge.refunded) {
    logger.info({ chargeId: charge.id, amountRefunded: charge.amount_refunded }, 'Partial refund, order not changed')
    return
  }

  const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id
  if (!paymentIntentId) return

  const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntentId, limit: 1 })
  const session = sessions.data[0]
  if (!session) {
    logger.warn({ paymentIntentId }, 'No checkout session found for refunded charge')
    return
  }

  const order = await prisma.order.findUnique({
    where: { stripeSessionId: session.id },
    select: cancellableOrderSelect,
  })
  if (!order) {
    logger.warn({ sessionId: session.id }, 'No order found for refunded charge')
    return
  }
  if (order.status === 'CANCELLED') {
    logger.info({ orderId: order.id }, 'Order already cancelled, skipping refund webhook')
    return
  }

  const refunds = await stripe.refunds.list({ charge: charge.id, limit: 1 })
  const refundId = refunds.data[0]?.id ?? null

  await applyCancellation(order, refundId)
  logger.info(
    { orderId: order.id, refundId, previousStatus: order.status, restocked: order.status === 'PAID' },
    'Order cancelled from Stripe refund',
  )
}

export default { cancelAndRefund, handleChargeRefunded }
