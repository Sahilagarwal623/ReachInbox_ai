import { Queue, QueueEvents } from 'bullmq';
import { redisClient } from './rateLimiter';

export const EMAIL_QUEUE_NAME = 'email-queue';

export interface EmailJobPayload {
  emailScheduleId: string;
}

export const emailQueue = new Queue<EmailJobPayload>(EMAIL_QUEUE_NAME, {
  connection: redisClient,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs for telemetry
    removeOnFail: 200,     // Keep failed jobs for inspection
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

export const emailQueueEvents = new QueueEvents(EMAIL_QUEUE_NAME, {
  connection: redisClient,
});

export async function addEmailJobToQueue(emailScheduleId: string, delayMs: number): Promise<string> {
  const jobId = `email-${emailScheduleId}`;
  const effectiveDelay = Math.max(0, delayMs);

  const job = await emailQueue.add(
    'send-email',
    { emailScheduleId },
    {
      jobId,
      delay: effectiveDelay,
    }
  );

  console.log(`📌 Queued job ${job.id} for EmailSchedule ${emailScheduleId} with delay ${effectiveDelay}ms`);
  return job.id as string;
}

export async function removeJobFromQueue(jobId: string): Promise<boolean> {
  try {
    const job = await emailQueue.getJob(jobId);
    if (job) {
      await job.remove();
      console.log(`🗑️ Removed job ${jobId} from BullMQ queue.`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`⚠️ Failed to remove job ${jobId} from queue:`, error);
    return false;
  }
}
