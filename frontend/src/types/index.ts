export type EmailStatus = 'SCHEDULED' | 'RATE_LIMITED' | 'PROCESSING' | 'SENT' | 'FAILED' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  googleId: string | null;
}

export interface EmailSchedule {
  id: string;
  userId: string;
  senderEmail: string;
  recipient: string;
  subject: string;
  body: string;
  status: EmailStatus;
  scheduledAt: string;
  sentAt?: string | null;
  etherealUrl?: string | null;
  errorMessage?: string | null;
  jobId?: string | null;
  delayMs: number;
  hourlyLimit: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface StatsOverviewData {
  totalScheduled: number;
  rateLimited: number;
  processing: number;
  totalSent: number;
  totalFailed: number;
  pendingTotal: number;
}
