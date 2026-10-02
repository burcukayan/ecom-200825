import pino from 'pino'
import { env } from './env'

const logger = pino({
  name: env.APP_ID,
  level: env.LOG_LEVEL,
})

export default logger
