import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { prisma } from './db/client';
import authRoutes from './routes/auth.routes';
import emailRoutes from './routes/email.routes';
import { getEtherealTransporter } from './services/ethereal.service';
import { startEmailWorker } from './queue/emailWorker';
import { emailQueue } from './queue/emailQueue';

async function bootstrap() {
  console.log('🚀 Initializing ReachInbox Email Job Scheduler Backend Service...');

  // 1. Verify PostgreSQL Database Connection
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL Database connected successfully.');
  } catch (err: any) {
    console.error('❌ Failed to connect to PostgreSQL Database:', err.message);
    process.exit(1);
  }

  // 2. Initialize Ethereal Email SMTP Account
  try {
    const { senderEmail } = await getEtherealTransporter();
    console.log(`📧 Ethereal SMTP Ready. Default Sender Email: ${senderEmail}`);
  } catch (err: any) {
    console.warn('⚠️ Ethereal SMTP initialization warning:', err.message);
  }

  // 3. Start BullMQ Queue Worker
  const worker = startEmailWorker();

  // 4. Boot Recovery Check: Resynchronize DB scheduled jobs with BullMQ Queue
  try {
    console.log('🔄 Running boot recovery check for scheduled emails...');
    const pendingSchedules = await prisma.emailSchedule.findMany({
      where: { status: { in: ['SCHEDULED', 'RATE_LIMITED'] } },
    });

    let recoveredCount = 0;
    for (const schedule of pendingSchedules) {
      const jobId = schedule.jobId || `email-${schedule.id}`;
      const existingJob = await emailQueue.getJob(jobId);

      if (!existingJob) {
        const delayFromNow = Math.max(0, new Date(schedule.scheduledAt).getTime() - Date.now());
        await emailQueue.add(
          'send-email',
          { emailScheduleId: schedule.id },
          { jobId, delay: delayFromNow }
        );
        recoveredCount++;
      }
    }
    if (recoveredCount > 0) {
      console.log(`✅ Boot Recovery: Re-enqueued ${recoveredCount} pending emails into BullMQ!`);
    } else {
      console.log(`✅ Boot Recovery: All pending jobs are active in BullMQ.`);
    }
  } catch (err: any) {
    console.error('⚠️ Boot recovery check failed:', err.message);
  }

  // 5. Express Application Setup
  const app = express();

  app.use(cors({ origin: '*', credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health Check Endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'online',
      service: 'ReachInbox Email Job Scheduler',
      timestamp: new Date().toISOString(),
      concurrency: env.WORKER_CONCURRENCY,
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/emails', emailRoutes);

  // Start HTTP Server
  const server = app.listen(env.PORT, () => {
    console.log(`\n======================================================`);
    console.log(`✨ ReachInbox Email Scheduler API running at http://localhost:${env.PORT}`);
    console.log(`======================================================\n`);
  });

  // Graceful Shutdown Handler
  const shutdown = async () => {
    console.log('\n🛑 Graceful shutdown initiated...');
    server.close(() => {
      console.log('HTTP Server closed.');
    });
    await worker.close();
    await prisma.$disconnect();
    console.log('Database & Workers gracefully disconnected.');
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
