export const prisma = {
  order: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    groupBy: jest.fn(),
  },
  orderItem: {
    groupBy: jest.fn(),
  },
  product: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
}

export function resetPrismaMock() {
  prisma.$transaction.mockImplementation((callback: (tx: typeof prisma) => unknown) => callback(prisma))
}
