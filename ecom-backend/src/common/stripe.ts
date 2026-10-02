import Stripe from 'stripe'
import { env } from './env'

export const stripe = new Stripe(env.STRIPE_SECRET_KEY)
export const endpointSecret = env.STRIPE_WEBHOOK_SECRET
