import axios from 'axios';
import { EmailSchedule, StatsOverviewData, User } from '../types';

const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') return '/api';
  return 'http://localhost:4000/api';
};

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function fetchScheduledEmails(userId?: string): Promise<EmailSchedule[]> {
  const res = await api.get<{ success: boolean; data: EmailSchedule[] }>('/emails/scheduled', {
    params: { userId },
  });
  return res.data.data;
}

export async function fetchSentEmails(userId?: string): Promise<EmailSchedule[]> {
  const res = await api.get<{ success: boolean; data: EmailSchedule[] }>('/emails/sent', {
    params: { userId },
  });
  return res.data.data;
}

export async function fetchStats(userId?: string): Promise<StatsOverviewData> {
  const res = await api.get<{ success: boolean; stats: StatsOverviewData }>('/emails/stats', {
    params: { userId },
  });
  return res.data.stats;
}

export async function submitScheduleBatch(formData: FormData): Promise<any> {
  const res = await api.post('/emails/schedule', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}

export async function cancelSchedule(id: string, userId?: string): Promise<any> {
  const res = await api.post(`/emails/cancel/${id}`, { userId });
  return res.data;
}

export async function parseCsvFile(file: File): Promise<{ count: number; emails: string[] }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post<{ success: boolean; count: number; emails: string[] }>('/emails/parse-csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return { count: res.data.count, emails: res.data.emails };
}

export async function syncGoogleUser(userData: {
  email: string;
  name?: string | null;
  avatar?: string | null;
  googleId?: string | null;
}): Promise<User> {
  const res = await api.post<{ success: boolean; user: User }>('/auth/google', userData);
  return res.data.user;
}
