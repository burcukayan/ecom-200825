import express, { Application, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import { env } from './common/env'
import routes from './common/routes'
import unknownEndpoint from './middlewares/unknownEndpoint'
import { errorHandler } from './middlewares/errorHandler'
import stripeWebhooksController from './resources/stripe/webhooks/controller'

const app: Application = express()

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }))
app.use(compression())

app.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhooksController.receiveUpdates)

app.use(express.json({ limit: env.REQUEST_LIMIT }))
app.use(express.urlencoded({ extended: true, limit: env.REQUEST_LIMIT }))

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ 'health-check': 'OK: top level api working' })
})

app.use('/v1', routes)

app.use(unknownEndpoint)
app.use(errorHandler)

export default app
