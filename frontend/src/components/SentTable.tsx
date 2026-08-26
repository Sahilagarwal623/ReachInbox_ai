'use client';

import React, { useState } from 'react';
import { EmailSchedule } from '../types';
import { CheckCircle2, AlertOctagon, ExternalLink, Search, Mail, Calendar, Send, X } from 'lucide-react';

interface SentTableProps {
  emails: EmailSchedule[];
  loading: boolean;
}

export function SentTable({ emails, loading }: SentTableProps) {
  const [search, setSearch] = useState('');

  const filtered = emails.filter(
    (e) =>
      e.recipient.toLowerCase().includes(search.toLowerCase()) ||
      e.subject.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' · ' +
      d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-grow max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search sent emails..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-2 border border-slate-800/50 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/40 transition-all"
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
          <span className="text-slate-300 font-semibold">{filtered.length}</span> delivery logs
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
                <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Delivered At</th>
                <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Status</th>
                <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500 text-right">Preview</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4"><div className="h-4 shimmer rounded w-36" /></td>
                    <td className="px-6 py-4"><div className="h-4 shimmer rounded w-48" /></td>
                    <td className="px-6 py-4"><div className="h-4 shimmer rounded w-28" /></td>
                    <td className="px-6 py-4"><div className="h-4 shimmer rounded w-16" /></td>
                    <td className="px-6 py-4"><div className="h-4 shimmer rounded w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="max-w-xs mx-auto space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto">
                        <Send className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-slate-200 font-semibold text-base">No Sent Emails Yet</p>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {search
                            ? 'No matches found for your search query.'
                            : 'Scheduled emails will appear here once processed by BullMQ workers and delivered via Ethereal SMTP.'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="row-glow border-b border-slate-800/30 last:border-0 transition-colors duration-200"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                          item.status === 'SENT'
                            ? 'bg-emerald-500/10 border-emerald-500/15'
                            : 'bg-rose-500/10 border-rose-500/15'
                        }`}>
                          <Mail className={`w-3.5 h-3.5 ${
                            item.status === 'SENT' ? 'text-emerald-400' : 'text-rose-400'
                          }`} />
                        </div>
                        <span className="font-medium text-white truncate max-w-[180px]">
                          {item.recipient}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-200 truncate max-w-[220px]">{item.subject}</p>
                      {item.errorMessage ? (
                        <p className="text-[11px] text-rose-400/80 truncate max-w-[220px] mt-0.5">
                          {item.errorMessage}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-600 truncate max-w-[220px] mt-0.5">
                          {item.body.slice(0, 50)}...
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
                        <Calendar className="w-3 h-3 text-slate-600 flex-shrink-0" />
                        <span>{formatDate(item.sentAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.status === 'SENT' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Delivered
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/15">
                          <AlertOctagon className="w-3 h-3 mr-1" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.etherealUrl ? (
                        <a
                          href={item.etherealUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-[11px] font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/30 transition-all duration-200 btn-press"
                        >
                          Open Inbox
                          <ExternalLink className="w-3 h-3 ml-1.5" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-600">—</span>
                      )}
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
