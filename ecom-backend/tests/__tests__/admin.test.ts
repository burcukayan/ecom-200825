import supertest from 'supertest'
import Stripe from 'stripe'
import app from '../../src/app'
import { prisma, resetPrismaMock } from '../helpers/prisma-mock'
import { stripe } from '../helpers/stripe-mock'
import emailService from '../../src/services/email/service'

jest.mock('../../src/common/prisma', () => jest.requireActual('../helpers/prisma-mock'))
jest.mock('../../src/common/stripe', () => jest.requireActual('../helpers/stripe-mock'))
jest.mock('../../src/middlewares/auth', () => jest.requireActual('../helpers/auth-mock'))
jest.mock('../../src/services/email/service', () => ({
  __esModule: true,
  default: {
    sendOrderConfirmationEmail: jest.fn(),
    sendOrderShippedEmail: jest.fn(),
    sendOrderCancelledEmail: jest.fn(),
  },
}))

const request = supertest(app)
const ORDER_ID = '66f0c0ffee0000000000abcd'

beforeEach(() => {
  jest.resetAllMocks()
  resetPrismaMock()
})

describe('Admin authorization', () => {
  test('returns 401 without a token', async () => {
    const response = await request.get('/v1/admin/orders')
    expect(response.status).toBe(401)
    expect(prisma.order.findMany).not.toHaveBeenCalled()
  })

  test('returns 403 for a customer', async () => {
    const response = await request.get('/v1/admin/users').set('Authorization', 'Bearer customer')
    expect(response.status).toBe(403)
    expect(response.body).toEqual({ error: 'Forbidden' })
    expect(prisma.user.findMany).not.toHaveBeenCalled()
  })

  test('lists users with order counts for an admin', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 'u1', email: 'a@test.local', role: 'ADMIN', _count: { orders: 3 } }])

    const response = await request.get('/v1/admin/users').set('Authorization', 'Bearer admin')

    expect(response.status).toBe(200)
    expect(response.body).toEqual([{ id: 'u1', email: 'a@test.local', role: 'ADMIN', orderCount: 3 }])
  })
})

describe('PATCH /v1/admin/orders/:id/status', () => {
  const SHIPMENT = { carrier: 'Yurtiçi Kargo', trackingNumber: 'YK-123456' }
  const patchStatus = (id: string, status: string, extra: Record<string, unknown> = {}) =>
    request
      .patch(`/v1/admin/orders/${id}/status`)
      .set('Authorization', 'Bearer admin')
      .send({ status, ...(status === 'SHIPPING' ? SHIPMENT : {}), ...extra })

  test('returns 400 when shipping without a tracking number', async () => {
    const response = await patchStatus(ORDER_ID, 'SHIPPING', { trackingNumber: undefined })
    expect(response.status).toBe(400)
    expect(response.body.details).toHaveProperty('trackingNumber')
    expect(prisma.order.update).not.toHaveBeenCalled()
  })

  test('returns 400 for an unknown carrier', async () => {
    const response = await patchStatus(ORDER_ID, 'SHIPPING', { carrier: 'Teleport Express' })
    expect(response.status).toBe(400)
    expect(response.body.details).toHaveProperty('carrier')
  })
  test('returns 404 for an invalid id', async () => {
    const response = await patchStatus('not-an-id', 'SHIPPING')
    expect(response.status).toBe(404)
    expect(prisma.order.findUnique).not.toHaveBeenCalled()
  })

  test('returns 404 when the order does not exist', async () => {
    prisma.order.findUnique.mockResolvedValue(null)
    const response = await patchStatus(ORDER_ID, 'SHIPPING')
    expect(response.status).toBe(404)
  })

  test('returns 400 for a status that cannot be set manually', async () => {
    const response = await patchStatus(ORDER_ID, 'CANCELLED')
    expect(response.status).toBe(400)
  })

  test('returns 409 when skipping a step (PAID -> COMPLETED)', async () => {
    prisma.order.findUnique.mockResolvedValue({ status: 'PAID' })
    const response = await patchStatus(ORDER_ID, 'COMPLETED')
    expect(response.status).toBe(409)
    expect(prisma.order.update).not.toHaveBeenCalled()
  })

  test('marks a paid order as shipped and sends the shipped email', async () => {
    prisma.order.findUnique.mockResolvedValue({ status: 'PAID' })
    prisma.order.update.mockResolvedValue({ id: ORDER_ID, status: 'SHIPPING' })

    const response = await patchStatus(ORDER_ID, 'SHIPPING')

    expect(response.status).toBe(200)
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ORDER_ID },
        data: {
          status: 'SHIPPING',
          shippedAt: expect.any(Date),
          carrier: 'Yurtiçi Kargo',
          trackingNumber: 'YK-123456',
        },
      }),
    )
    expect(emailService.sendOrderShippedEmail).toHaveBeenCalledWith(ORDER_ID)
  })

  test('does not send an email when completing an order', async () => {
    prisma.order.findUnique.mockResolvedValue({ status: 'SHIPPING' })
    prisma.order.update.mockResolvedValue({ id: ORDER_ID, status: 'COMPLETED' })

    const response = await patchStatus(ORDER_ID, 'COMPLETED')

    expect(response.status).toBe(200)
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'COMPLETED', completedAt: expect.any(Date) } }),
    )
    expect(emailService.sendOrderShippedEmail).not.toHaveBeenCalled()
  })
})

describe('POST /v1/admin/orders/:id/cancel', () => {
  const cancel = (id: string) => request.post(`/v1/admin/orders/${id}/cancel`).set('Authorization', 'Bearer admin')

  const paidOrder = {
    id: ORDER_ID,
    status: 'PAID',
    stripeSessionId: 'cs_test_1',
    orderItems: [
      { productId: 'p1', quantity: 2 },
      { productId: 'p2', quantity: 1 },
    ],
  }

  test('returns 404 when the order does not exist', async () => {
    prisma.order.findUnique.mockResolvedValue(null)
    const response = await cancel(ORDER_ID)
    expect(response.status).toBe(404)
  })

  test('returns 409 for a shipped order and does not refund', async () => {
    prisma.order.findUnique.mockResolvedValue({ ...paidOrder, status: 'SHIPPING' })

    const response = await cancel(ORDER_ID)

    expect(response.status).toBe(409)
    expect(stripe.refunds.create).not.toHaveBeenCalled()
  })

  test('refunds, cancels, restocks and sends the cancelled email', async () => {
    prisma.order.findUnique
      .mockResolvedValueOnce(paidOrder)
      .mockResolvedValueOnce({ id: ORDER_ID, status: 'CANCELLED' })
    stripe.checkout.sessions.retrieve.mockResolvedValue({ payment_intent: 'pi_1' })
    stripe.refunds.create.mockResolvedValue({ id: 're_1', status: 'succeeded' })
    prisma.order.updateMany.mockResolvedValue({ count: 1 })

    const response = await cancel(ORDER_ID)

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('CANCELLED')
    expect(stripe.refunds.create).toHaveBeenCalledWith(expect.objectContaining({ payment_intent: 'pi_1' }), {
      idempotencyKey: `refund-order-${ORDER_ID}`,
    })
    expect(prisma.order.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: ORDER_ID, status: 'PAID' } }),
    )
    expect(prisma.product.updateMany).toHaveBeenCalledTimes(2)
    expect(prisma.product.updateMany).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { stock: { increment: 2 } },
    })
    expect(emailService.sendOrderCancelledEmail).toHaveBeenCalledWith(ORDER_ID)
  })

  test('does not restock or email when another request already cancelled the order', async () => {
    prisma.order.findUnique.mockResolvedValueOnce(paidOrder).mockResolvedValueOnce({ id: ORDER_ID })
    stripe.checkout.sessions.retrieve.mockResolvedValue({ payment_intent: 'pi_1' })
    stripe.refunds.create.mockResolvedValue({ id: 're_1', status: 'succeeded' })
    prisma.order.updateMany.mockResolvedValue({ count: 0 })

    const response = await cancel(ORDER_ID)

    expect(response.status).toBe(200)
    expect(prisma.product.updateMany).not.toHaveBeenCalled()
    expect(emailService.sendOrderCancelledEmail).not.toHaveBeenCalled()
  })

  test('returns 502 and leaves the order unchanged when Stripe fails', async () => {
    prisma.order.findUnique.mockResolvedValue(paidOrder)
    stripe.checkout.sessions.retrieve.mockResolvedValue({ payment_intent: 'pi_1' })
    stripe.refunds.create.mockRejectedValue(
      new Stripe.errors.StripeInvalidRequestError({ message: 'Charge has already been refunded.' }),
    )

    const response = await cancel(ORDER_ID)

    expect(response.status).toBe(502)
    expect(response.body).toEqual({ error: 'Charge has already been refunded.' })
    expect(prisma.order.updateMany).not.toHaveBeenCalled()
  })
})
