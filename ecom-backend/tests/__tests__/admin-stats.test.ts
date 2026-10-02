import supertest from 'supertest'
import app from '../../src/app'
import { prisma, resetPrismaMock } from '../helpers/prisma-mock'

jest.mock('../../src/common/prisma', () => jest.requireActual('../helpers/prisma-mock'))
jest.mock('../../src/common/stripe', () => jest.requireActual('../helpers/stripe-mock'))
jest.mock('../../src/middlewares/auth', () => jest.requireActual('../helpers/auth-mock'))

const request = supertest(app)

beforeEach(() => {
  jest.resetAllMocks()
  resetPrismaMock()
})

describe('GET /v1/admin/stats', () => {
  test('returns 403 for a customer', async () => {
    const response = await request.get('/v1/admin/stats').set('Authorization', 'Bearer customer')
    expect(response.status).toBe(403)
    expect(prisma.order.groupBy).not.toHaveBeenCalled()
  })

  test('returns revenue per currency, status counts, top products and low stock', async () => {
    prisma.order.groupBy
      .mockResolvedValueOnce([{ currency: 'TRY', _sum: { totalCents: 7500 }, _count: { _all: 2 } }])
      .mockResolvedValueOnce([{ currency: 'TRY', _sum: { totalCents: 5000 }, _count: { _all: 1 } }])
      .mockResolvedValueOnce([
        { status: 'PAID', _count: { _all: 1 } },
        { status: 'CANCELLED', _count: { _all: 2 } },
      ])
    prisma.orderItem.groupBy.mockResolvedValue([
      { productId: 'p1', _sum: { quantity: 4 } },
      { productId: 'gone', _sum: { quantity: 1 } },
    ])
    prisma.product.findMany
      .mockResolvedValueOnce([{ id: 'p1', name: 'Mug', stock: 2 }])
      .mockResolvedValueOnce([{ id: 'p1', name: 'Mug', imageUrls: ['https://img/mug.jpg'] }])
    prisma.user.count.mockResolvedValue(7)

    const response = await request.get('/v1/admin/stats').set('Authorization', 'Bearer admin')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      revenue: {
        allTime: [{ currency: 'TRY', totalCents: 7500, orderCount: 2 }],
        last30Days: [{ currency: 'TRY', totalCents: 5000, orderCount: 1 }],
      },
      ordersByStatus: { PAID: 1, CANCELLED: 2 },
      topProducts: [
        { productId: 'p1', name: 'Mug', imageUrl: 'https://img/mug.jpg', quantitySold: 4 },
        { productId: 'gone', name: 'Deleted product', imageUrl: null, quantitySold: 1 },
      ],
      lowStock: [{ id: 'p1', name: 'Mug', stock: 2 }],
      lowStockThreshold: 5,
      customerCount: 7,
    })
    expect(prisma.order.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: { in: ['PAID', 'SHIPPING', 'COMPLETED'] } } }),
    )
    expect(prisma.orderItem.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { order: { status: { in: ['PAID', 'SHIPPING', 'COMPLETED'] } } } }),
    )
  })
})
