import { NextFunction, Request, Response } from 'express'
import { UnauthorizedError } from 'express-oauth2-jwt-bearer'
import { z } from 'zod'
import logger from '../common/logger'

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof UnauthorizedError) {
    return res.status(err.status).json({ error: err.message })
  }

  if (err instanceof z.ZodError) {
    return res.status(400).json({ error: 'Invalid data', details: z.flattenError(err).fieldErrors })
  }

  logger.error({ err, path: req.path }, 'Unhandled error')
  res.status(500).json({ error: 'Internal server error' })
}
