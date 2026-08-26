'use client';

import React, { useState } from 'react';
import { User } from '../types';
import { Mail, LogOut, Sparkles, UserCheck, ShieldCheck, CheckCircle2, Globe, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface HeaderProps {
  user: User | null;
  onLogin: (userData: { email: string; name: string; avatar: string }) => void;
  onLogout: () => void;
  onOpenCompose: () => void;
}

export function Header({ user, onLogin, onLogout, onOpenCompose }: HeaderProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  const handleDemoGoogleLogin = (email: string, name: string, avatar: string) => {
    onLogin({ email, name, avatar });
    setShowLoginModal(false);
    toast.success(`Logged in as ${name}`);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;
    const name = customName || customEmail.split('@')[0];
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(customEmail)}`;
    handleDemoGoogleLogin(customEmail, name, avatar);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface-1/80 backdrop-blur-2xl border-b border-slate-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[2px] shadow-glow-sm">
              <div className="h-full w-full bg-surface-0 rounded-[10px] flex items-center justify-center">
                <Mail className="h-4 w-4 text-indigo-400" />
              </div>
            </div>
            <div className="flex items-center space-x-2.5">
              <span className="font-extrabold text-lg tracking-tight text-white">
                ReachInbox<span className="text-indigo-400">.ai</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/15">
                <Sparkles className="w-2.5 h-2.5 mr-1" />
                Scheduler
              </span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <button
                  onClick={onOpenCompose}
                  className="hidden sm:inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:shadow-indigo-500/30 hover:scale-[1.02] btn-press"
                >
                  <Mail className="w-3.5 h-3.5 mr-2" />
                  New Campaign
                </button>

                {/* User Profile Badge */}
                <div className="flex items-center space-x-2.5 bg-surface-3 border border-slate-700/40 rounded-full pl-1.5 pr-3 py-1 shadow-inner-glow">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || 'User'}
                      className="w-7 h-7 rounded-full border border-indigo-400/20 object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs">
                      {(user.name || user.email)[0].toUpperCase()}
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-slate-100 leading-tight">
                      {user.name || 'User'}
                    </p>
                    <p className="text-[10px] text-slate-500 leading-tight truncate max-w-[130px]">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={onLogout}
                    title="Logout"
                    className="text-slate-500 hover:text-rose-400 p-1 rounded-full hover:bg-rose-500/10 transition-all duration-200"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/20 transition-all duration-300 btn-press"
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Sign In with Google
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Google Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-surface-2 border border-slate-800/60 rounded-2xl max-w-md w-full shadow-2xl shadow-black/40 animate-fade-in overflow-hidden">
            {/* Gradient top bar */}
            <div className="h-1 gradient-border" />

            <div className="p-6 sm:p-8 space-y-6">
              {/* Header */}
              <div className="text-center space-y-3">
                <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-glow-sm">
                  <Globe className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Google OAuth</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Sign in to manage your email outreach campaigns
                  </p>
                </div>
              </div>

              {/* Quick Demo Google Profiles */}
              <div className="space-y-2.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">
                  Select Test Account
                </p>

                <button
                  onClick={() =>
                    handleDemoGoogleLogin(
                      'sahil.outreach@reachinbox.ai',
                      'Sahil Agarwal',
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
                    )
                  }
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-surface-3 hover:bg-surface-4 border border-slate-700/40 hover:border-indigo-500/30 text-left transition-all duration-300 group"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250"
                      alt="Sahil"
                      className="w-10 h-10 rounded-full object-cover border border-slate-700/50 group-hover:border-indigo-500/30 transition-colors"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-100">Sahil Agarwal</p>
                      <p className="text-xs text-slate-500">sahil.outreach@reachinbox.ai</p>
                    </div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </button>

                <button
                  onClick={() =>
                    handleDemoGoogleLogin(
                      'growth.lead@outboxlabs.com',
                      'Growth Team',
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250'
                    )
                  }
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-surface-3 hover:bg-surface-4 border border-slate-700/40 hover:border-indigo-500/30 text-left transition-all duration-300 group"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250"
                      alt="Growth"
                      className="w-10 h-10 rounded-full object-cover border border-slate-700/50 group-hover:border-indigo-500/30 transition-colors"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-100">Growth Lead</p>
                      <p className="text-xs text-slate-500">growth.lead@outboxlabs.com</p>
                    </div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800/60" />
                <span className="flex-shrink mx-4 text-[10px] font-medium text-slate-600 uppercase tracking-wider">
                  Or custom email
                </span>
                <div className="flex-grow border-t border-slate-800/60" />
              </div>

              {/* Custom form */}
              <form onSubmit={handleCustomSubmit} className="space-y-3">
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-0 border border-slate-800/60 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/20 transition-all duration-300 btn-press"
                >
                  Continue with Email
                </button>
              </form>

              <button
                onClick={() => setShowLoginModal(false)}
                className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
