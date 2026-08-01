import nodemailer from 'nodemailer';

/**
 * Build a nodemailer transport.
 *
 * In development we default to a "capture" transport (jsonTransport) so that
 * no real SMTP server or credentials are needed: emails are serialized and
 * returned instead of being delivered. Set SMTP_HOST/SMTP_PORT/etc. to send
 * through a real SMTP server.
 */
export function createMailer(env = process.env) {
  if (env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT || 587),
      secure: env.SMTP_SECURE === 'true',
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }
  // Dev/test capture transport: does not deliver, just serializes the message.
  return nodemailer.createTransport({ jsonTransport: true });
}

const FROM = process.env.MAIL_FROM || 'Martin <martin@example.com>';

export async function sendIssue(transport, { subject, body }, subscribers) {
  const results = [];
  for (const subscriber of subscribers) {
    const info = await transport.sendMail({
      from: FROM,
      to: subscriber.email,
      subject,
      text: body,
    });
    results.push({ email: subscriber.email, messageId: info.messageId });
  }
  return results;
}
