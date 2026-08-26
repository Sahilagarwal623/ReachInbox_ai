import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'ReachInbox.ai — Email Outreach Job Scheduler',
  description:
    'Production-grade email job scheduler with BullMQ delayed queues, Redis rate limiting, PostgreSQL persistence & Ethereal SMTP delivery.',
  keywords: ['email scheduler', 'BullMQ', 'Redis', 'cold email', 'outreach'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${inter.className}`}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#141a2a',
              color: '#f1f5f9',
              border: '1px solid rgba(99, 102, 241, 0.15)',
              borderRadius: '14px',
              fontSize: '13px',
              fontWeight: '500',
              padding: '12px 16px',
              boxShadow: '0 20px 40px -12px rgba(0,0,0,0.5), 0 0 20px -5px rgba(99,102,241,0.1)',
            },
            success: {
              iconTheme: {
                primary: '#34d399',
                secondary: '#141a2a',
              },
            },
            error: {
              iconTheme: {
                primary: '#f87171',
                secondary: '#141a2a',
              },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
