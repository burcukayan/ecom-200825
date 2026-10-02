import Stripe from 'stripe'
import { prisma } from '../../common/prisma'
import { stripe } from '../../common/stripe'
import logger from '../../common/logger'
import emailService from '../email/service'
import { Currency } from '../../../prisma/generated/prisma/client'

class OutOfStockError extends Error {}

function toCurrency(value: string | null | undefined): Currency {
  const upper = (value ?? '').toUpperCase()
  if (upper in Currency) return upper as Currency
  throw new Error(`Unsupported currency: ${value}`)
}

async function handleSuccessfulCheckout(sessionId: string) {
  const existing = await prisma.order.findUnique({ where: { stripeSessionId: sessionId } })
  if (existing) {
    logger.info({ sessionId }, 'Order already exists for this session, skipping')
    return existing
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items.data.price'],
  })

  if (session.payment_status !== 'paid') {
    logger.warn({ sessionId, status: session.payment_status }, 'Session not paid yet, skipping')
    return null
  }

  const auth0Id = session.client_reference_id
  if (!auth0Id) throw new Error(`Session ${sessionId} has no client_reference_id`)

  const user = await prisma.user.findUnique({ where: { auth0Id } })
  if (!user) throw new Error(`No user found for auth0Id ${auth0Id}`)

  const lineItems = session.line_items?.data ?? []
  const priceIds = lineItems
    .map((li) => (typeof li.price === 'string' ? li.price : li.price?.id))
    .filter((id): id is string => Boolean(id))

  const products = await prisma.product.findMany({ where: { stripePriceId: { in: priceIds } } })
  const productByPriceId = new Map(products.map((p) => [p.stripePriceId, p]))

  const items = lineItems.map((li) => {
    const priceId = typeof li.price === 'string' ? li.price : li.price?.id
    const product = priceId ? productByPriceId.get(priceId) : undefined
    if (!product) throw new Error(`No product found for price ${priceId}`)
    return {
      productId: product.id,
      name: product.name,
      quantity: li.quantity ?? 1,
      priceCents:
        li.price && typeof li.price !== 'string' ? li.price.unit_amount ?? product.priceCents : product.priceCents,
      currency: toCurrency(li.currency),
    }
  })

  try {
    const order = await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const result = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        })
        if (result.count === 0) throw new OutOfStockError(item.productId)
      }

      return tx.order.create({
        data: {
          userId: user.id,
          stripeSessionId: session.id,
          status: 'PAID',
          totalCents: session.amount_total ?? 0,
          currency: toCurrency(session.currency),
          email: session.customer_details?.email ?? user.email,
          shippingAddress: formatAddress(session.collected_information?.shipping_details?.address),
          orderItems: { create: items },
        },
        include: { orderItems: true },
      })
    })

    void emailService.sendOrderConfirmationEmail(order, order.email ?? user.email)

    return order
  } catch (err) {
    if (err instanceof OutOfStockError) {
      logger.error({ sessionId, productId: err.message }, 'Out of stock after payment, refund needed')
    }
    throw err
  }
}

function formatAddress(address: Stripe.Address | null | undefined): string | null {
  if (!address) return null
  return [address.line1, address.line2, address.postal_code, address.city, address.state, address.country]
    .filter(Boolean)
    .join(', ')
}

export default { handleSuccessfulCheckout }
