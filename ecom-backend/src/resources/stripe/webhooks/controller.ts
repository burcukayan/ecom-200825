import { Request, Response } from 'express'
import Stripe from 'stripe'
import { endpointSecret, stripe } from '../../../common/stripe'
import checkoutService from '../../../services/checkout/service'
import orderService from '../../../services/orders/service'
import logger from '../../../common/logger'

async function receiveUpdates(req: Request, res: Response) {
  const signature = req.headers['stripe-signature']

  if (typeof signature !== 'string') {
    return res.status(400).send('Missing stripe-signature header')
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret)
  } catch (err) {
    logger.warn({ err }, 'Webhook signature verification failed')
    return res.sendStatus(400)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        await checkoutService.handleSuccessfulCheckout(event.data.object.id)
        break
      case 'charge.refunded':
        await orderService.handleChargeRefunded(event.data.object)
        break
      default:
        logger.debug({ type: event.type }, 'Unhandled Stripe event')
    }
    res.json({ received: true })
  } catch (err) {
    logger.error({ err, eventId: event.id }, 'Webhook handler failed')
    res.sendStatus(500)
  }
}

export default { receiveUpdates }
