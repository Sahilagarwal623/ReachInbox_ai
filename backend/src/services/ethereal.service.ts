import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';

let cachedTransporter: Transporter | null = null;
let cachedSenderEmail: string | null = null;

export async function getEtherealTransporter(): Promise<{ transporter: Transporter; senderEmail: string }> {
  if (cachedTransporter && cachedSenderEmail) {
    return { transporter: cachedTransporter, senderEmail: cachedSenderEmail };
  }

  let user = env.ETHEREAL_USER;
  let pass = env.ETHEREAL_PASS;

  if (!user || !pass) {
    console.log('🔄 Generating new Ethereal Email test account...');
    const testAccount = await nodemailer.createTestAccount();
    user = testAccount.user;
    pass = testAccount.pass;
    console.log(`✅ Ethereal Email test account created: User: ${user}`);
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user, pass },
    pool: true, // Use pooled SMTP connection for high performance
    maxConnections: 5,
    maxMessages: 100,
  });

  cachedTransporter = transporter;
  cachedSenderEmail = user;

  return { transporter, senderEmail: user };
}
