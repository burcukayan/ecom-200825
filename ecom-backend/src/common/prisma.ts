import { PrismaClient } from '../../prisma/generated/prisma/client'
import './env'

export const prisma = new PrismaClient()
