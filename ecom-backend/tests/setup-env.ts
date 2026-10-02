Object.assign(process.env, {
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  DATABASE_URL: 'mongodb://localhost:27017/ecom-test',
  FRONTEND_URL: 'http://localhost:3000',
  STRIPE_SECRET_KEY: 'sk_test_dummy',
  STRIPE_WEBHOOK_SECRET: 'whsec_test_dummy',
  AUTH0_AUDIENCE: 'https://api.test.local',
  AUTH0_ISSUER_BASE_URL: 'https://test.local/',
  AUTH0_NAMESPACE: 'https://ecom-200825.com/',
  RESEND_API_KEY: 're_test_dummy',
})
