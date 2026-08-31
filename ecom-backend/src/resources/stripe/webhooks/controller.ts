import { Request, Response } from 'express'
import { endpointSecret, stripe } from '../../../common/stripe'

async function receiveUpdates(req: Request, res: Response) {
  console.log('Reached stripe webhooks receive updates function')
  let event = req.body

  if (endpointSecret) {
    const signature = req.headers['stripe-signature'] as string
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret)
    } catch (err: any) {
      console.log(`⚠️  Webhook signature verification failed.`, err.message)
      return res.sendStatus(400)
    }
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object
      console.log(`✅ Checkout is successful! Customer completed payment. (Session: ${session.id})`)
      break
    case 'product.created':
    case 'product.updated':
      const product = event.data.object
      console.log(`📦 Admin Event: Product created or updated. (Product: ${product.id})`)
      break
    case 'product.deleted':
      const deletedProduct = event.data.object
      console.log(`🗑️ Admin Event: Product deleted/archived from Stripe. (Product: ${deletedProduct.id})`)
      break
    default:
      console.log(`Unhandled event type ${event.type}.`)
  }

  res.send()
}

export default {
  receiveUpdates,
}
