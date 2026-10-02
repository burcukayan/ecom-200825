import supertest from 'supertest'
import app from '../../src/app'
import { prisma, resetPrismaMock } from '../helpers/prisma-mock'
import { stripe } from '../helpers/stripe-mock'

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
const CUSTOMER_ID = '66f0c0ffee00000000000001'

const customer = {
  id: CUSTOMER_ID,
  auth0Id: 'auth0|customer',
  email: 'customer@test.local',
  emailVerified: false,
  role: 'CUSTOMER',
}

const order = (status: string) => ({
  id: ORDER_ID,
  status,
  totalCents: 4998,
  currency: 'TRY',
  email: 'customer@test.local',
  shippingAddress: 'Lara Cd. 1, 07100, Antalya, TR',
  stripeSessionId: 'cs_test_1',
  stripeRefundId: null,
  createdAt: new Date('2026-09-28T10:00:00Z'),
  shippedAt: null,
  completedAt: null,
  cancelledAt: null,
  orderItems: [{ id: 'i1', name: 'Mug', quantity: 2, priceCents: 2499, currency: 'TRY', productId: 'p1' }],
})

beforeEach(() => {
  jest.resetAllMocks()
  resetPrismaMock()
  prisma.user.findUnique.mockResolvedValue(customer)
})

describe('GET /v1/orders/:id', () => {
  const getOrder = (id: string) => request.get(`/v1/orders/${id}`).set('Authorization', 'Bearer customer')

  test("returns 404 for another user's order", async () => {
    prisma.order.findFirst.mockResolvedValue(null)

    const response = await getOrder(ORDER_ID)

    expect(response.status).toBe(404)
    expect(prisma.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: ORDER_ID, userId: CUSTOMER_ID } }),
    )
  })

  test('returns 404 for an invalid id without querying the database', async () => {
    const response = await getOrder('not-an-id')
    expect(response.status).toBe(404)
    expect(prisma.order.findFirst).not.toHaveBeenCalled()
  })

  test('returns the order with the Stripe receipt link and hides internal fields', async () => {
    prisma.order.findFirst.mockResolvedValue(order('PAID'))
    stripe.checkout.sessions.retrieve.mockResolvedValue({
      payment_intent: { latest_charge: { receipt_url: 'https://pay.stripe.com/receipts/test' } },
    })

    const response = await getOrder(ORDER_ID)

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      id: ORDER_ID,
      status: 'PAID',
      refunded: false,
      receiptUrl: 'https://pay.stripe.com/receipts/test',
    })
    expect(response.body).not.toHaveProperty('stripeSessionId')
    expect(response.body).not.toHaveProperty('stripeRefundId')
  })

  test('still returns the order when Stripe is unreachable', async () => {
    prisma.order.findFirst.mockResolvedValue(order('PAID'))
    stripe.checkout.sessions.retrieve.mockRejectedValue(new Error('network down'))

    const response = await getOrder(ORDER_ID)

    expect(response.status).toBe(200)
    expect(response.body.receiptUrl).toBeNull()
  })
})

describe('POST /v1/orders/:id/cancel', () => {
  const cancel = (id: string) => request.post(`/v1/orders/${id}/cancel`).set('Authorization', 'Bearer customer')

  test("returns 404 and does not refund another user's order", async () => {
    prisma.order.findFirst.mockResolvedValue(null)

    const response = await cancel(ORDER_ID)

    expect(response.status).toBe(404)
    expect(stripe.refunds.create).not.toHaveBeenCalled()
  })

  test('returns 409 once the order has shipped', async () => {
    prisma.order.findFirst.mockResolvedValue(order('SHIPPING'))
    prisma.order.findUnique.mockResolvedValue({ ...order('SHIPPING'), orderItems: [] })

    const response = await cancel(ORDER_ID)

    expect(response.status).toBe(409)
    expect(response.body).toEqual({ error: 'This order can no longer be cancelled.' })
    expect(stripe.refunds.create).not.toHaveBeenCalled()
  })

  test('refunds and cancels a paid order', async () => {
    prisma.order.findFirst
      .mockResolvedValueOnce(order('PAID'))
      .mockResolvedValueOnce({ ...order('CANCELLED'), stripeRefundId: 're_1' })
    prisma.order.findUnique.mockResolvedValue({
      id: ORDER_ID,
      status: 'PAID',
      stripeSessionId: 'cs_test_1',
      orderItems: [{ productId: 'p1', quantity: 2 }],
    })
    stripe.checkout.sessions.retrieve.mockResolvedValue({ payment_intent: 'pi_1' })
    stripe.refunds.create.mockResolvedValue({ id: 're_1', status: 'succeeded' })
    prisma.order.updateMany.mockResolvedValue({ count: 1 })

    const response = await cancel(ORDER_ID)

    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ status: 'CANCELLED', refunded: true })
    expect(stripe.refunds.create).toHaveBeenCalledTimes(1)
    expect(prisma.product.updateMany).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { stock: { increment: 2 } },
    })
  })
})
