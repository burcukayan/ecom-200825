import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8000),
  APP_ID: z.string().default('api'),
  LOG_LEVEL: z.string().default('info'),
  REQUEST_LIMIT: z.string().default('100kb'),

  DATABASE_URL: z.string().min(1),
  FRONTEND_URL: z.url().default('http://localhost:3000'),

  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),

  AUTH0_AUDIENCE: z.string().min(1),
  AUTH0_ISSUER_BASE_URL: z.url(),
  AUTH0_NAMESPACE: z.string().default('https://ecom-200825.com/'),

  RESEND_API_KEY: z.string().startsWith('re_').optional(),
  MAIL_FROM: z.string().default('Ecommerce Store <onboarding@resend.dev>'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:', z.flattenError(parsed.error).fieldErrors)
  process.exit(1)
}

export const env = parsed.data
