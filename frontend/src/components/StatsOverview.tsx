'use client';

import React from 'react';
import { StatsOverviewData } from '../types';
import { Clock, Flame, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';

interface StatsOverviewProps {
  stats: StatsOverviewData | null;
  loading: boolean;
}

export function StatsOverview({ stats, loading }: StatsOverviewProps) {
  const cards = [
    {
      title: 'Scheduled',
      subtitle: 'BullMQ Delayed Queue',
      value: stats?.totalScheduled ?? 0,
      icon: Clock,
      accentColor: 'indigo',
      gradient: 'from-indigo-500/15 to-blue-500/5',
      borderColor: 'border-indigo-500/20',
      iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/15',
      valueColor: 'text-indigo-300',
    },
    {
      title: 'Rate Limited',
      subtitle: 'Hourly Throttle',
      value: stats?.rateLimited ?? 0,
      icon: Flame,
      accentColor: 'amber',
      gradient: 'from-amber-500/15 to-orange-500/5',
      borderColor: 'border-amber-500/20',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/15',
      valueColor: 'text-amber-300',
    },
    {
      title: 'Sent',
      subtitle: 'Ethereal Delivered',
      value: stats?.totalSent ?? 0,
      icon: CheckCircle,
      accentColor: 'emerald',
      gradient: 'from-emerald-500/15 to-teal-500/5',
      borderColor: 'border-emerald-500/20',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15',
      valueColor: 'text-emerald-300',
    },
    {
      title: 'Failed',
      subtitle: 'Errors Logged',
      value: stats?.totalFailed ?? 0,
      icon: AlertTriangle,
      accentColor: 'rose',
      gradient: 'from-rose-500/15 to-pink-500/5',
      borderColor: 'border-rose-500/20',
      iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/15',
      valueColor: 'text-rose-300',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`glow-card rounded-2xl bg-gradient-to-br ${card.gradient} ${card.borderColor} border p-5 shadow-xl animate-fade-in`}
            style={{ animationDelay: `${(idx + 1) * 60}ms` }}
          >
            {/* Top row: title + icon */}
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-0.5">
                <h3 className="text-sm font-semibold text-slate-200">{card.title}</h3>
                <p className="text-[10px] text-slate-500 font-medium">{card.subtitle}</p>
              </div>
              <div className={`p-2 rounded-xl ${card.iconBg} border shadow-inner-glow`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            {/* Value */}
            <div className="flex items-end justify-between">
              <div className={`text-3xl font-extrabold tabular-nums tracking-tight ${card.valueColor}`}>
                {loading ? (
                  <div className="h-9 w-14 shimmer rounded-lg" />
                ) : (
                  card.value.toLocaleString()
                )}
              </div>
              {!loading && stats && (
                <div className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-surface-0/60 border border-slate-800/40">
                  <TrendingUp className="w-3 h-3 text-slate-500" />
                  <span className="text-[10px] font-medium text-slate-500">
                    {stats.pendingTotal} pending
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
