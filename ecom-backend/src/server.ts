import './common/env'
import * as os from 'os'
import app from './app'
import logger from './common/logger'
import { env } from './common/env'
import { prisma } from './common/prisma'

const server = app.listen(env.PORT, () => {
  logger.info(`up and running in ${env.NODE_ENV} @: ${os.hostname()} on port ${env.PORT}`)
})

const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down`)
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}
process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))
