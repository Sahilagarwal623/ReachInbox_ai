import { Worker, Job } from 'bullmq';
import nodemailer from 'nodemailer';
import { EMAIL_QUEUE_NAME, EmailJobPayload, emailQueue } from './emailQueue';
import { redisClient, checkAndIncrementHourlyLimit } from './rateLimiter';
import { prisma } from '../db/client';
import { getEtherealTransporter } from '../services/ethereal.service';
import { env } from '../config/env';

export function startEmailWorker(): Worker<EmailJobPayload> {
  const worker = new Worker<EmailJobPayload>(
    EMAIL_QUEUE_NAME,
    async (job: Job<EmailJobPayload>, token?: string) => {
      const { emailScheduleId } = job.data;
      console.log(`\n🚀 [Worker] Processing job ${job.id} for Schedule ID: ${emailScheduleId}`);

      // 1. Fetch record from PostgreSQL
      const schedule = await prisma.emailSchedule.findUnique({
        where: { id: emailScheduleId },
        include: { user: true },
      });

      if (!schedule) {
        console.warn(`⚠️ [Worker] EmailSchedule ${emailScheduleId} not found in DB. Skipping.`);
        return { status: 'skipped', reason: 'not_found' };
      }

      // 2. Check Idempotency / Cancellation
      if (schedule.status === 'SENT') {
        console.log(`ℹ️ [Worker] EmailSchedule ${emailScheduleId} already SENT. Skipping duplicate execution.`);
        return { status: 'skipped', reason: 'already_sent' };
      }

      if (schedule.status === 'CANCELLED') {
        console.log(`ℹ️ [Worker] EmailSchedule ${emailScheduleId} was CANCELLED. Skipping.`);
        return { status: 'skipped', reason: 'cancelled' };
      }

      // 3. Mark as PROCESSING in DB
      await prisma.emailSchedule.update({
        where: { id: emailScheduleId },
        data: { status: 'PROCESSING' },
      });

      // 4. Rate Limiting Check (Atomic Redis Counter)
      const sender = schedule.senderEmail;
      const hourlyLimit = schedule.hourlyLimit || env.DEFAULT_HOURLY_LIMIT;

      const rateLimitCheck = await checkAndIncrementHourlyLimit(sender, hourlyLimit);

      if (!rateLimitCheck.allowed) {
        const rescheduleMs = rateLimitCheck.remainingMs;
        const nextTime = new Date(Date.now() + rescheduleMs);

        console.log(
          `⏳ [Worker] Rate limit exceeded for ${sender} (Limit: ${hourlyLimit}/hr). Rescheduling job ${job.id} for ${nextTime.toISOString()} (+${Math.round(
            rescheduleMs / 1000
          )}s)`
        );

        // Update DB status to RATE_LIMITED and record next scheduledAt
        await prisma.emailSchedule.update({
          where: { id: emailScheduleId },
          data: {
            status: 'RATE_LIMITED',
            scheduledAt: nextTime,
          },
        });

        // Re-enqueue job with delay into BullMQ
        await emailQueue.add(
          'send-email',
          { emailScheduleId },
          { jobId: `email-${emailScheduleId}-${Date.now()}`, delay: rescheduleMs }
        );

        return { status: 'rate_limited', rescheduleMs, nextTime };
      }

      // 5. Send Email via Ethereal SMTP
      try {
        const { transporter } = await getEtherealTransporter();

        const info = await transporter.sendMail({
          from: `"${schedule.user?.name || 'ReachInbox Outreach'}" <${schedule.senderEmail}>`,
          to: schedule.recipient,
          subject: schedule.subject,
          text: schedule.body,
          html: `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #4f46e5; margin-top: 0;">${schedule.subject}</h2>
              <div style="color: #334155; line-height: 1.6; font-size: 15px;">
                ${schedule.body.replace(/\n/g, '<br/>')}
              </div>
              <hr style="margin-top: 24px; border: none; border-top: 1px solid #f1f5f9;" />
              <p style="font-size: 12px; color: #94a3b8;">Sent via ReachInbox.ai High-Scale Scheduler</p>
            </div>
          `,
        });

        const etherealUrl = nodemailer.getTestMessageUrl(info) || null;

        // 6. Update DB status to SENT
        await prisma.emailSchedule.update({
          where: { id: emailScheduleId },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            etherealUrl: typeof etherealUrl === 'string' ? etherealUrl : null,
            errorMessage: null,
          },
        });

        console.log(`✨ [Worker] Successfully sent email to ${schedule.recipient}!`);
        if (etherealUrl) {
          console.log(`🔗 Ethereal Preview URL: ${etherealUrl}`);
        }

        return { status: 'sent', recipient: schedule.recipient, etherealUrl };
      } catch (error: any) {
        console.error(`❌ [Worker] Failed to send email to ${schedule.recipient}:`, error);

        await prisma.emailSchedule.update({
          where: { id: emailScheduleId },
          data: {
            status: 'FAILED',
            errorMessage: error.message || 'Unknown SMTP error',
          },
        });

        throw error; // Let BullMQ retry job based on backoff strategy
      }
    },
    {
      connection: redisClient,
      concurrency: env.WORKER_CONCURRENCY,
    }
  );

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`💥 Job ${job?.id} failed with error: ${err.message}`);
  });

  console.log(`⚙️ BullMQ Email Worker started with concurrency level: ${env.WORKER_CONCURRENCY}`);

  return worker;
}
