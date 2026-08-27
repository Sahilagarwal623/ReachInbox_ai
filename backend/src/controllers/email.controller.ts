import { Request, Response } from 'express';
import {
  scheduleEmailBatch,
  getScheduledEmails,
  getSentEmails,
  cancelEmailSchedule,
  parseEmailsFromText,
} from '../services/email.service';
import { prisma } from '../db/client';

export async function handleScheduleBatch(req: Request, res: Response) {
  try {
    const { userId, senderEmail, subject, body, recipients, startTime, delayMs, hourlyLimit } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!subject || !body) {
      return res.status(400).json({ error: 'Subject and Body are required' });
    }

    let leadList: string[] = [];

    if (Array.isArray(recipients)) {
      leadList = recipients;
    } else if (typeof recipients === 'string') {
      try {
        const parsed = JSON.parse(recipients);
        if (Array.isArray(parsed)) {
          leadList = parsed;
        } else {
          leadList = parseEmailsFromText(recipients);
        }
      } catch {
        leadList = parseEmailsFromText(recipients);
      }
    }

    if (req.file) {
      const fileContent = req.file.buffer.toString('utf-8');
      const fileLeads = parseEmailsFromText(fileContent);
      leadList = Array.from(new Set([...leadList, ...fileLeads]));
    }

    if (leadList.length === 0) {
      return res.status(400).json({ error: 'No valid recipient email addresses were provided or detected' });
    }

    const result = await scheduleEmailBatch({
      userId,
      senderEmail,
      subject,
      body,
      recipients: leadList,
      startTime,
      delayMs: delayMs ? parseInt(delayMs, 10) : undefined,
      hourlyLimit: hourlyLimit ? parseInt(hourlyLimit, 10) : undefined,
    });

    return res.status(201).json({ success: true, ...result });
  } catch (error: any) {
    console.error('❌ Error in handleScheduleBatch:', error);
    return res.status(500).json({ success: false, error: error?.message || String(error) || 'Failed to schedule emails' });
  }
}

export async function handleGetScheduled(req: Request, res: Response) {
  try {
    const userId = req.query.userId as string;
    const items = await getScheduledEmails(userId);
    return res.status(200).json({ success: true, data: items });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function handleGetSent(req: Request, res: Response) {
  try {
    const userId = req.query.userId as string;
    const items = await getSentEmails(userId);
    return res.status(200).json({ success: true, data: items });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function handleCancel(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.body.userId || (req.query.userId as string);
    const updated = await cancelEmailSchedule(id, userId);
    return res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function handleParseCsv(req: Request, res: Response) {
  try {
    let rawText = req.body.text || '';
    if (req.file) {
      rawText += '\n' + req.file.buffer.toString('utf-8');
    }

    const emails = parseEmailsFromText(rawText);
    return res.status(200).json({ success: true, count: emails.length, emails });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function handleGetStats(req: Request, res: Response) {
  try {
    const userId = req.query.userId as string;
    const whereClause = userId ? { userId } : {};

    const [totalScheduled, rateLimited, processing, totalSent, totalFailed] = await Promise.all([
      prisma.emailSchedule.count({ where: { ...whereClause, status: 'SCHEDULED' } }),
      prisma.emailSchedule.count({ where: { ...whereClause, status: 'RATE_LIMITED' } }),
      prisma.emailSchedule.count({ where: { ...whereClause, status: 'PROCESSING' } }),
      prisma.emailSchedule.count({ where: { ...whereClause, status: 'SENT' } }),
      prisma.emailSchedule.count({ where: { ...whereClause, status: 'FAILED' } }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalScheduled,
        rateLimited,
        processing,
        totalSent,
        totalFailed,
        pendingTotal: totalScheduled + rateLimited + processing,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
