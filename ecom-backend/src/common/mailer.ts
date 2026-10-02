import { Resend } from 'resend'
import { env } from './env'
import logger from './logger'

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

export type MailMessage = {
  to: string
  subject: string
  html: string
  text: string
  idempotencyKey?: string
}

export async function sendMail({ idempotencyKey, ...message }: MailMessage): Promise<void> {
  const logContext = { to: message.to, subject: message.subject }

  if (!resend) {
    logger.warn(logContext, 'RESEND_API_KEY not set, email skipped')
    return
  }

  try {
    const { data, error } = await resend.emails.send({ from: env.MAIL_FROM, ...message }, { idempotencyKey })
    if (error) {
      logger.error({ ...logContext, error }, 'Email could not be sent')
      return
    }
    logger.info({ ...logContext, emailId: data?.id }, 'Email sent')
  } catch (err) {
    logger.error({ ...logContext, err }, 'Email could not be sent')
  }
}
