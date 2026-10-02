import Stripe from 'stripe'

const realStripe = new Stripe('sk_test_dummy')

export const endpointSecret = 'whsec_test_dummy'

export const stripe = {
  webhooks: realStripe.webhooks,
  checkout: {
    sessions: { retrieve: jest.fn(), list: jest.fn() },
  },
  refunds: { create: jest.fn(), list: jest.fn() },
}
