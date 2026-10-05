import stripeLibrary from 'stripe'
import './env';



export const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripeApiKey = process.env.STRIPE_SECRET_KEY;
if (!endpointSecret || !stripeApiKey) {
  console.warn('Stripe keys are missing, check the set up and try again.')
}
export const stripe = stripeLibrary(stripeApiKey);

