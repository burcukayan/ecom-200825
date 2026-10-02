import { prisma } from '../../common/prisma'
import logger from '../../common/logger'
import { sendMail } from '../../common/mailer'
import { orderCancelledEmail, orderConfirmationEmail, orderShippedEmail, type EmailOrder } from './templates'

const emailOrderSelect = {
  id: true,
  totalCents: true,
  currency: true,
  shippingAddress: true,
  email: true,
  user: { select: { email: true } },
  orderItems: { select: { name: true, quantity: true, priceCents: true, currency: true } },
} as const

async function sendOrderConfirmationEmail(order: EmailOrder, to: string) {
  await sendMail({
    to,
    ...orderConfirmationEmail(order),
    idempotencyKey: `order-confirmation/${order.id}`,
  })
}

async function sendOrderStatusEmail(
  orderId: string,
  kind: 'shipped' | 'cancelled',
  template: (order: EmailOrder) => { subject: string; html: string; text: string },
) {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: emailOrderSelect })
    if (!order) {
      logger.warn({ orderId, kind }, 'Order not found, status email skipped')
      return
    }

    await sendMail({
      to: order.email ?? order.user.email,
      ...template(order),
      idempotencyKey: `order-${kind}/${order.id}`,
    })
  } catch (err) {
    logger.error({ err, orderId, kind }, 'Could not prepare status email')
  }
}

const sendOrderShippedEmail = (orderId: string) => sendOrderStatusEmail(orderId, 'shipped', orderShippedEmail)
const sendOrderCancelledEmail = (orderId: string) => sendOrderStatusEmail(orderId, 'cancelled', orderCancelledEmail)

export default { sendOrderConfirmationEmail, sendOrderShippedEmail, sendOrderCancelledEmail }
