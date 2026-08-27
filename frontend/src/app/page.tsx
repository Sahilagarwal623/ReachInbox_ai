'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User, EmailSchedule, StatsOverviewData } from '../types';
import {
  fetchScheduledEmails,
  fetchSentEmails,
  fetchStats,
  syncGoogleUser,
} from '../lib/api';
import { Header } from '../components/Header';
import { StatsOverview } from '../components/StatsOverview';
import { ComposeModal } from '../components/ComposeModal';
import { ScheduledTable } from '../components/ScheduledTable';
import { SentTable } from '../components/SentTable';
import { CheckCircle2, Clock, RefreshCw, Send, Sparkles, Zap, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');
  const [scheduledEmails, setScheduledEmails] = useState<EmailSchedule[]>([]);
  const [sentEmails, setSentEmails] = useState<EmailSchedule[]>([]);
  const [stats, setStats] = useState<StatsOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // Initialize Default User or Restore Session
  useEffect(() => {
    const savedUser = localStorage.getItem('reachinbox_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.name === 'Sahil Agarwal' || parsed.email?.includes('sahil')) {
          parsed.name = 'Riddhi Arora';
          parsed.email = 'riddhi.outreach@reachinbox.ai';
          localStorage.setItem('reachinbox_user', JSON.stringify(parsed));
        }
        setUser(parsed);
      } catch (e) {
        console.error(e);
      }
    } else {
      // Default demo Google authenticated user for instant reviewer access
      const defaultUser: User = {
        id: 'demo-user-id-1',
        email: 'riddhi.outreach@reachinbox.ai',
        name: 'Riddhi Arora',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
        googleId: 'google-demo-default',
      };
      setUser(defaultUser);
      localStorage.setItem('reachinbox_user', JSON.stringify(defaultUser));
      syncGoogleUser(defaultUser).catch(console.error);
    }
  }, []);

  const loadData = useCallback(async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      const userId = user?.id;

      const [scheduledData, sentData, statsData] = await Promise.all([
        fetchScheduledEmails(userId),
        fetchSentEmails(userId),
        fetchStats(userId),
      ]);

      setScheduledEmails(scheduledData);
      setSentEmails(sentData);
      setStats(statsData);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      if (showToast) {
        setIsRefreshing(false);
        toast.success('Dashboard refreshed');
      }
    }
  }, [user]);

  // Initial Load + Auto Refresh interval (every 4s for live worker tracking)
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleLogin = async (userData: { email: string; name: string; avatar: string }) => {
    try {
      const synced = await syncGoogleUser(userData);
      setUser(synced);
      localStorage.setItem('reachinbox_user', JSON.stringify(synced));
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to log in');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('reachinbox_user');
    toast('Logged out successfully', { icon: '👋' });
  };

  return (
    <div className="min-h-screen bg-surface-0 text-slate-100 flex flex-col">
      {/* Subtle grid background */}
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-40 pointer-events-none" />

      {/* Ambient gradient orbs */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/[0.04] blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/[0.03] blur-[100px] rounded-full pointer-events-none" />

      {/* Header Bar */}
      <Header
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onOpenCompose={() => setIsComposeOpen(true)}
      />

      {/* Main Content Area */}
      <main className="relative flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="animate-fade-in rounded-2xl bg-surface-2 border border-slate-800/60 shadow-2xl relative overflow-hidden">
          {/* Decorative gradient stripe */}
          <div className="absolute top-0 left-0 right-0 h-[2px] gradient-border" />

          {/* Ambient glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/[0.06] blur-[80px] rounded-full pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-500/[0.04] blur-[60px] rounded-full pointer-events-none -ml-10 -mb-10" />

          <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold text-indigo-300 uppercase tracking-[0.15em] bg-indigo-500/10 border border-indigo-500/20">
                  <Sparkles className="w-3 h-3 mr-1.5" />
                  ReachInbox Engine
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                  <Activity className="w-3 h-3 mr-1" />
                  Live
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                Email Outreach Job Scheduler
              </h1>
              <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
                Persistent delayed queue powered by{' '}
                <span className="text-indigo-300 font-semibold">BullMQ + Redis</span> &{' '}
                <span className="text-indigo-300 font-semibold">PostgreSQL</span> with atomic
                hourly rate limiting and Ethereal SMTP delivery.
              </p>
            </div>

            <div className="flex items-center space-x-3 flex-shrink-0">
              <button
                onClick={() => loadData(true)}
                className="p-2.5 rounded-xl bg-surface-3 border border-slate-700/50 text-slate-400 hover:text-white hover:border-indigo-500/30 hover:bg-surface-4 transition-all duration-300 btn-press"
                title="Refresh Queue Data"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
              {user && (
                <button
                  onClick={() => setIsComposeOpen(true)}
                  className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/25 transition-all duration-300 hover:shadow-indigo-500/30 hover:scale-[1.02] btn-press"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Compose Outreach
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Telemetry Stats Overview */}
        <StatsOverview stats={stats} loading={loading} />

        {/* Tab Navigation + Content */}
        <div className="space-y-6 animate-fade-in" style={{ animationDelay: '150ms' }}>
          <div className="border-b border-slate-800/60 flex items-center justify-between">
            <nav className="flex space-x-1 -mb-px">
              <button
                onClick={() => setActiveTab('scheduled')}
                className={`relative py-3 px-4 text-sm font-semibold flex items-center space-x-2 transition-all duration-300 rounded-t-lg ${
                  activeTab === 'scheduled'
                    ? 'text-indigo-400 bg-indigo-500/[0.06]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Scheduled Queue</span>
                <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold tabular-nums ${
                  activeTab === 'scheduled'
                    ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                    : 'bg-slate-800/60 text-slate-400 border border-slate-700/30'
                }`}>
                  {scheduledEmails.length}
                </span>
                {activeTab === 'scheduled' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('sent')}
                className={`relative py-3 px-4 text-sm font-semibold flex items-center space-x-2 transition-all duration-300 rounded-t-lg ${
                  activeTab === 'sent'
                    ? 'text-emerald-400 bg-emerald-500/[0.06]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Sent Emails</span>
                <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold tabular-nums ${
                  activeTab === 'sent'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-800/60 text-slate-400 border border-slate-700/30'
                }`}>
                  {sentEmails.length}
                </span>
                {activeTab === 'sent' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
                )}
              </button>
            </nav>
          </div>

          {/* Active Tab View */}
          <div className="animate-fade-in" key={activeTab}>
            {activeTab === 'scheduled' ? (
              <ScheduledTable
                emails={scheduledEmails}
                loading={loading}
                onRefresh={() => loadData(false)}
              />
            ) : (
              <SentTable emails={sentEmails} loading={loading} />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-slate-800/40 bg-surface-1 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Built for <span className="text-slate-400 font-medium">ReachInbox.ai</span> Full-stack Hiring Assignment
          </p>
          <div className="flex items-center space-x-4 text-xs text-slate-600">
            <span className="flex items-center space-x-1.5">
              <Zap className="w-3 h-3 text-indigo-500/60" />
              <span>BullMQ</span>
            </span>
            <span className="text-slate-800">•</span>
            <span>Redis</span>
            <span className="text-slate-800">•</span>
            <span>PostgreSQL</span>
            <span className="text-slate-800">•</span>
            <span>Ethereal SMTP</span>
          </div>
        </div>
      </footer>

      {/* Compose Modal */}
      {user && (
        <ComposeModal
          user={user}
          isOpen={isComposeOpen}
          onClose={() => setIsComposeOpen(false)}
          onSuccess={() => loadData(true)}
        />
      )}
    </div>
  );
}
