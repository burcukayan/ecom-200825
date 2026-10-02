import { env } from '../../common/env'
import type { Currency } from '../../../prisma/generated/prisma/client'

export type EmailOrder = {
  id: string
  totalCents: number
  currency: Currency
  shippingAddress: string | null
  carrier?: string | null
  trackingNumber?: string | null
  orderItems: { name: string; quantity: number; priceCents: number; currency: Currency }[]
}

type EmailContent = { subject: string; html: string; text: string }

const formatPrice = (cents: number, currency: Currency) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const shortId = (id: string) => id.slice(-8).toUpperCase()

function buildOrderEmail(
  order: EmailOrder,
  content: { subject: string; heading: string; intro: string; details?: { label: string; value: string }[] },
): EmailContent {
  const orderUrl = `${env.FRONTEND_URL}/orders/${order.id}`
  const total = formatPrice(order.totalCents, order.currency)

  const rows = order.orderItems
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee">${item.quantity} × ${escapeHtml(item.name)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${formatPrice(item.priceCents * item.quantity, item.currency)}</td>
        </tr>`,
    )
    .join('')

  const details = content.details ?? []
  const detailsHtml = details
    .map(
      (detail) =>
        `<p style="margin:4px 0"><strong>${escapeHtml(detail.label)}:</strong> ${escapeHtml(detail.value)}</p>`,
    )
    .join('')

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111">
      <h1 style="font-size:20px">${escapeHtml(content.heading)}</h1>
      <p>${escapeHtml(content.intro)}</p>
      ${detailsHtml}
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${rows}
        <tr>
          <td style="padding:12px 0;font-weight:bold">Total</td>
          <td style="padding:12px 0;font-weight:bold;text-align:right">${total}</td>
        </tr>
      </table>
      ${order.shippingAddress ? `<p style="font-size:14px"><strong>Shipping to:</strong><br>${escapeHtml(order.shippingAddress)}</p>` : ''}
      <p><a href="${orderUrl}" style="color:#2563eb">View your order</a></p>
    </div>`

  const text = [
    content.heading,
    content.intro,
    ...details.map((detail) => `${detail.label}: ${detail.value}`),
    '',
    ...order.orderItems.map(
      (item) => `${item.quantity} x ${item.name}: ${formatPrice(item.priceCents * item.quantity, item.currency)}`,
    ),
    `Total: ${total}`,
    order.shippingAddress ? `Shipping to: ${order.shippingAddress}` : '',
    '',
    `View your order: ${orderUrl}`,
  ].join('\n')

  return { subject: content.subject, html, text }
}

export function orderConfirmationEmail(order: EmailOrder): EmailContent {
  const orderNo = shortId(order.id)
  return buildOrderEmail(order, {
    subject: `Order confirmation #${orderNo}`,
    heading: 'Thank you for your order',
    intro: `We received your payment. Your order number is #${orderNo}.`,
  })
}

export function orderShippedEmail(order: EmailOrder): EmailContent {
  const orderNo = shortId(order.id)
  return buildOrderEmail(order, {
    subject: `Your order #${orderNo} has shipped`,
    heading: 'Your order is on its way',
    intro: `Good news: your order #${orderNo} has been shipped.`,
    details: [
      ...(order.carrier ? [{ label: 'Carrier', value: order.carrier }] : []),
      ...(order.trackingNumber ? [{ label: 'Tracking number', value: order.trackingNumber }] : []),
    ],
  })
}

export function orderCancelledEmail(order: EmailOrder): EmailContent {
  const orderNo = shortId(order.id)
  return buildOrderEmail(order, {
    subject: `Your order #${orderNo} has been cancelled`,
    heading: 'Your order has been cancelled',
    intro: `Your order #${orderNo} has been cancelled and a full refund of ${formatPrice(order.totalCents, order.currency)} has been issued to your original payment method. It may take 5-10 business days to appear on your statement.`,
  })
}
