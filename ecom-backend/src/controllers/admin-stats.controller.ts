import { Request, Response, NextFunction } from 'express'
import { prisma } from '../common/prisma'
import type { OrderStatus } from '../../prisma/generated/prisma/client'

const REVENUE_STATUSES: OrderStatus[] = ['PAID', 'SHIPPING', 'COMPLETED']
const LOW_STOCK_THRESHOLD = 5
const DAY_MS = 24 * 60 * 60 * 1000

const revenueByCurrency = (since?: Date) =>
  prisma.order.groupBy({
    by: ['currency'],
    where: { status: { in: REVENUE_STATUSES }, ...(since ? { createdAt: { gte: since } } : {}) },
    _sum: { totalCents: true },
    _count: { _all: true },
    orderBy: { currency: 'asc' },
  })

export const getStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const since30Days = new Date(Date.now() - 30 * DAY_MS)

    const [revenueAll, revenue30, statusGroups, topItems, lowStock, customerCount] = await Promise.all([
      revenueByCurrency(),
      revenueByCurrency(since30Days),
      prisma.order.groupBy({ by: ['status'], _count: { _all: true }, orderBy: { status: 'asc' } }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: { order: { status: { in: REVENUE_STATUSES } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      prisma.product.findMany({
        where: { isActive: true, stock: { lte: LOW_STOCK_THRESHOLD } },
        orderBy: { stock: 'asc' },
        take: 10,
        select: { id: true, name: true, stock: true },
      }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
    ])

    const products = await prisma.product.findMany({
      where: { id: { in: topItems.map((item) => item.productId) } },
      select: { id: true, name: true, imageUrls: true },
    })
    const productById = new Map(products.map((product) => [product.id, product]))

    const toRevenue = (groups: Awaited<ReturnType<typeof revenueByCurrency>>) =>
      groups.map((group) => ({
        currency: group.currency,
        totalCents: group._sum.totalCents ?? 0,
        orderCount: group._count._all,
      }))

    res.status(200).json({
      revenue: { allTime: toRevenue(revenueAll), last30Days: toRevenue(revenue30) },
      ordersByStatus: Object.fromEntries(statusGroups.map((group) => [group.status, group._count._all])),
      topProducts: topItems.map((item) => ({
        productId: item.productId,
        name: productById.get(item.productId)?.name ?? 'Deleted product',
        imageUrl: productById.get(item.productId)?.imageUrls[0] ?? null,
        quantitySold: item._sum.quantity ?? 0,
      })),
      lowStock,
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      customerCount,
    })
  } catch (error) {
    next(error)
  }
}
