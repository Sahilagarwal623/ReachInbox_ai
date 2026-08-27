'use client';

import React, { useState } from 'react';
import { User } from '../types';
import { submitScheduleBatch } from '../lib/api';
import {
  X,
  UploadCloud,
  Clock,
  Zap,
  CheckCircle2,
  Mail,
  Sliders,
  Send,
  Loader2,
  FileSpreadsheet,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Papa from 'papaparse';

interface ComposeModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ComposeModal({ user, isOpen, onClose, onSuccess }: ComposeModalProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [detectedEmails, setDetectedEmails] = useState<string[]>([]);
  const [rawTextRecipients, setRawTextRecipients] = useState('');
  const [startTime, setStartTime] = useState<string>('');
  const [delaySeconds, setDelaySeconds] = useState<number>(2);
  const [hourlyLimit, setHourlyLimit] = useState<number>(200);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const extractEmailsFromText = (text: string) => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = text.match(emailRegex) || [];
    return Array.from(new Set(matches.map((e) => e.trim().toLowerCase())));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const emails = extractEmailsFromText(content);
      setDetectedEmails(emails);
      if (emails.length > 0) {
        toast.success(`Detected ${emails.length} email addresses`);
      } else {
        toast.error(`No valid emails found in ${selectedFile.name}`);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleRawTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawTextRecipients(val);
    const emails = extractEmailsFromText(val);
    setDetectedEmails(emails);
  };

  const setSendRightAway = () => {
    const now = new Date();
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setStartTime(localIso);
    toast('Scheduled for right now', { icon: '⚡' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalRecipients = [...detectedEmails];
    if (finalRecipients.length === 0 && rawTextRecipients) {
      finalRecipients = extractEmailsFromText(rawTextRecipients);
    }

    if (finalRecipients.length === 0) {
      toast.error('Upload a CSV or enter recipient emails');
      return;
    }

    if (!subject.trim()) {
      toast.error('Subject is required');
      return;
    }

    if (!body.trim()) {
      toast.error('Email body is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('senderEmail', user.email);
      formData.append('subject', subject);
      formData.append('body', body);
      formData.append('recipients', JSON.stringify(finalRecipients));
      if (startTime) {
        const parsedDate = new Date(startTime);
        if (!isNaN(parsedDate.getTime())) {
          formData.append('startTime', parsedDate.toISOString());
        }
      }
      formData.append('delayMs', (delaySeconds * 1000).toString());
      formData.append('hourlyLimit', hourlyLimit.toString());

      if (file) {
        formData.append('file', file);
      }

      await submitScheduleBatch(formData);

      toast.success(`Scheduled ${finalRecipients.length} emails`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Schedule batch failed:', err);
      const serverMessage = err.response?.data?.error || err.message || 'Failed to schedule batch';
      toast.error(serverMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-surface-2 border border-slate-800/50 rounded-2xl max-w-2xl w-full shadow-2xl shadow-black/40 animate-fade-in my-8 overflow-hidden">
        {/* Gradient top bar */}
        <div className="h-1 gradient-border" />

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/15 text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">New Outreach Campaign</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Configure recipients, throttling & rate limits
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-white rounded-xl hover:bg-surface-4 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Subject */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-2">
                Subject Line
              </label>
              <input
                type="text"
                placeholder="e.g. Scaling outreach with AI-powered workflows"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 bg-surface-0 border border-slate-800/50 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 transition-all"
                required
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-2">
                Email Body
              </label>
              <textarea
                rows={4}
                placeholder="Hi {{firstName}},&#10;&#10;I noticed your team is scaling cold email outreach..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-4 py-3 bg-surface-0 border border-slate-800/50 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 transition-all leading-relaxed resize-none"
                required
              />
            </div>

            {/* Lead List Upload */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                  Lead List
                </label>
                {detectedEmails.length > 0 && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {detectedEmails.length} Emails Detected
                  </span>
                )}
              </div>

              <div className="relative border border-dashed border-slate-700/50 hover:border-indigo-500/30 rounded-xl p-5 bg-surface-0/50 text-center transition-all duration-300 group cursor-pointer">
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  {file ? (
                    <FileSpreadsheet className="w-8 h-8 text-emerald-400" />
                  ) : (
                    <UploadCloud className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 transition-colors duration-300" />
                  )}
                  <p className="text-sm font-medium text-slate-300">
                    {file ? file.name : 'Drop CSV file here or click to browse'}
                  </p>
                  <p className="text-[10px] text-slate-600">Supports CSV, TXT with email columns</p>
                </div>
              </div>

              {/* Manual text input */}
              <textarea
                rows={2}
                placeholder="Or paste emails separated by commas (e.g. lead1@co.com, lead2@co.com)"
                value={rawTextRecipients}
                onChange={handleRawTextChange}
                className="w-full px-4 py-2.5 bg-surface-0 border border-slate-800/40 rounded-xl text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500/30 transition-all resize-none"
              />
            </div>

            {/* Scheduling Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/40">
              {/* Start Time */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-slate-400 flex items-center">
                    <Clock className="w-3 h-3 mr-1.5 text-indigo-400" />
                    Start Time
                  </label>
                  <button
                    type="button"
                    onClick={setSendRightAway}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                  >
                    Now
                  </button>
                </div>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-0 border border-slate-800/50 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500/40 transition-all"
                />
              </div>

              {/* Delay */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-2 flex items-center">
                  <Zap className="w-3 h-3 mr-1.5 text-amber-400" />
                  Delay (seconds)
                </label>
                <input
                  type="number"
                  min={0}
                  max={3600}
                  value={delaySeconds}
                  onChange={(e) => setDelaySeconds(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2.5 bg-surface-0 border border-slate-800/50 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500/40 transition-all tabular-nums"
                />
                <span className="text-[10px] text-slate-600 mt-1 block">Between each email</span>
              </div>

              {/* Hourly Limit */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-2 flex items-center">
                  <Sliders className="w-3 h-3 mr-1.5 text-emerald-400" />
                  Max / Hour
                </label>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={hourlyLimit}
                  onChange={(e) => setHourlyLimit(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2.5 bg-surface-0 border border-slate-800/50 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500/40 transition-all tabular-nums"
                />
                <span className="text-[10px] text-slate-600 mt-1 block">Hourly rate limit</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800/40">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-700/40 text-sm font-medium text-slate-400 hover:text-white hover:bg-surface-4 hover:border-slate-600/40 transition-all duration-200 btn-press"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed btn-press"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Queuing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Schedule Campaign
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
