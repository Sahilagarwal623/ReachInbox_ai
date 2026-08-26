'use client';

import React, { useState } from 'react';
import { EmailSchedule } from '../types';
import { cancelSchedule } from '../lib/api';
import { Clock, Flame, Loader2, Search, Trash2, Calendar, Mail, Inbox, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface ScheduledTableProps {
  emails: EmailSchedule[];
  loading: boolean;
  onRefresh: () => void;
}

export function ScheduledTable({ emails, loading, onRefresh }: ScheduledTableProps) {
  const [search, setSearch] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancel = async (id: string) => {
    try {
      setCancellingId(id);
      await cancelSchedule(id);
      toast.success('Email schedule cancelled');
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to cancel schedule');
    } finally {
      setCancellingId(null);
    }
  };

  const filtered = emails.filter(
    (e) =>
      e.recipient.toLowerCase().includes(search.toLowerCase()) ||
      e.subject.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' · ' +
      d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-grow max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by recipient or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-2 border border-slate-800/50 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="text-xs text-slate-500 tabular-nums">
          <span className="text-slate-300 font-semibold">{filtered.length}</span> scheduled emails
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-surface-2 border border-slate-800/50 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800/40">
                <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Recipient</th>
                <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Subject</th>
                <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Scheduled</th>
                <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Status</th>
                <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4"><div className="h-4 shimmer rounded w-36" /></td>
                    <td className="px-6 py-4"><div className="h-4 shimmer rounded w-48" /></td>
                    <td className="px-6 py-4"><div className="h-4 shimmer rounded w-28" /></td>
                    <td className="px-6 py-4"><div className="h-4 shimmer rounded w-20" /></td>
                    <td className="px-6 py-4"><div className="h-4 shimmer rounded w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="max-w-xs mx-auto space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/15 text-indigo-400 flex items-center justify-center mx-auto">
                        <Inbox className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-slate-200 font-semibold text-base">No Scheduled Emails</p>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {search
                            ? 'No matches found. Try a different search term.'
                            : 'Create a new outreach campaign to start scheduling emails into the BullMQ queue.'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="row-glow border-b border-slate-800/30 last:border-0 transition-colors duration-200"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                        <span className="font-medium text-white truncate max-w-[180px]">
                          {item.recipient}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-200 truncate max-w-[220px]">{item.subject}</p>
                      <p className="text-[11px] text-slate-600 truncate max-w-[220px] mt-0.5">
                        {item.body.slice(0, 50)}...
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
                        <Calendar className="w-3 h-3 text-slate-600 flex-shrink-0" />
                        <span>{formatDate(item.scheduledAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.status === 'SCHEDULED' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/15">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5 animate-pulse" />
                          Scheduled
                        </span>
                      )}
                      {item.status === 'RATE_LIMITED' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/15">
                          <Flame className="w-3 h-3 mr-1" />
                          Rate Limited
                        </span>
                      )}
                      {item.status === 'PROCESSING' && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/15">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Sending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleCancel(item.id)}
                        disabled={cancellingId === item.id}
                        title="Cancel Schedule"
                        className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-all duration-200 btn-press"
                      >
                        {cancellingId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
