import { prisma } from '../db/client';
import { addEmailJobToQueue, removeJobFromQueue } from '../queue/emailQueue';
import { getEtherealTransporter } from './ethereal.service';
import { env } from '../config/env';

export interface ScheduleBatchInput {
  userId: string;
  senderEmail?: string;
  subject: string;
  body: string;
  recipients: string[];
  startTime?: string | Date;
  delayMs?: number;
  hourlyLimit?: number;
}

export async function scheduleEmailBatch(input: ScheduleBatchInput) {
  const {
    userId,
    subject,
    body,
    recipients,
    startTime = new Date(),
    delayMs = env.DEFAULT_MIN_DELAY_MS,
    hourlyLimit = env.DEFAULT_HOURLY_LIMIT,
  } = input;

  let senderEmail = input.senderEmail;
  if (!senderEmail) {
    const { senderEmail: etherealSender } = await getEtherealTransporter();
    senderEmail = etherealSender;
  }

  // Ensure User exists in relational database
  let userRecord = await prisma.user.findUnique({ where: { id: userId } });
  if (!userRecord) {
    userRecord = await prisma.user.create({
      data: {
        id: userId,
        email: senderEmail || 'demo.user@reachinbox.ai',
        name: 'Sahil Agarwal',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      },
    });
  }

  const baseStartTime = new Date(startTime).getTime();
  const createdSchedules = [];

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i].trim();
    if (!recipient) continue;

    // Calculate staggered schedule time per lead based on minimum delay requirement
    const leadScheduledAt = new Date(baseStartTime + i * delayMs);
    const delayFromNow = leadScheduledAt.getTime() - Date.now();

    // 1. Save in Relational Database
    const schedule = await prisma.emailSchedule.create({
      data: {
        userId,
        senderEmail,
        recipient,
        subject,
        body,
        status: 'SCHEDULED',
        scheduledAt: leadScheduledAt,
        delayMs,
        hourlyLimit,
      },
    });

    // 2. Queue Delayed Job in BullMQ
    const jobId = await addEmailJobToQueue(schedule.id, delayFromNow);

    // 3. Update DB record with Job ID
    const updated = await prisma.emailSchedule.update({
      where: { id: schedule.id },
      data: { jobId },
    });

    createdSchedules.push(updated);
  }

  console.log(`✅ Successfully scheduled email batch of ${createdSchedules.length} leads for user ${userId}`);
  return {
    totalScheduled: createdSchedules.length,
    senderEmail,
    startTime: new Date(baseStartTime),
    delayMs,
    hourlyLimit,
    schedules: createdSchedules,
  };
}

export async function getScheduledEmails(userId?: string) {
  const whereClause = userId ? { userId } : {};
  return prisma.emailSchedule.findMany({
    where: {
      ...whereClause,
      status: { in: ['SCHEDULED', 'RATE_LIMITED', 'PROCESSING'] },
    },
    orderBy: { scheduledAt: 'asc' },
    include: { user: true },
  });
}

export async function getSentEmails(userId?: string) {
  const whereClause = userId ? { userId } : {};
  return prisma.emailSchedule.findMany({
    where: {
      ...whereClause,
      status: { in: ['SENT', 'FAILED'] },
    },
    orderBy: { updatedAt: 'desc' },
    include: { user: true },
  });
}

export async function cancelEmailSchedule(id: string, userId?: string) {
  const schedule = await prisma.emailSchedule.findUnique({
    where: { id },
  });

  if (!schedule) {
    throw new Error('Email schedule record not found');
  }

  if (userId && schedule.userId !== userId) {
    throw new Error('Unauthorized to cancel this email schedule');
  }

  if (schedule.jobId) {
    await removeJobFromQueue(schedule.jobId);
  }

  return prisma.emailSchedule.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });
}

export function parseEmailsFromText(rawText: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = rawText.match(emailRegex) || [];
  // Remove duplicates
  return Array.from(new Set(matches.map((e) => e.trim().toLowerCase())));
}
