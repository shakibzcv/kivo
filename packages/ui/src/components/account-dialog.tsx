'use client';

import { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Shield,
  Smartphone,
  Laptop,
  CheckCircle2,
  Trash2,
  Globe,
  LogOut,
} from 'lucide-react';
import { cn } from '../lib/utils';

export interface AccountSession {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface AccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id?: string;
    email?: string;
    name?: string;
    avatar?: string;
    provider?: string;
    createdAt?: string;
  } | null;
  isDark?: boolean;
  onSignOut?: () => void;
}

const DEFAULT_SESSIONS: AccountSession[] = [
  {
    id: 'sess_curr',
    device: 'Windows PC',
    browser: 'Chrome 122',
    location: 'Current Location',
    ip: '192.168.1.x',
    lastActive: 'Active now',
    isCurrent: true,
  },
  {
    id: 'sess_mob',
    device: 'Apple iPhone 15',
    browser: 'Mobile Safari',
    location: 'Signed in via Google',
    ip: '103.145.22.x',
    lastActive: '2 hours ago',
    isCurrent: false,
  },
  {
    id: 'sess_desk',
    device: 'Desktop Application',
    browser: 'Kivo Desktop (Electron)',
    location: 'Local Client',
    ip: '127.0.0.1',
    lastActive: '1 day ago',
    isCurrent: false,
  },
];

export function AccountDialog({
  isOpen,
  onClose,
  user,
  isDark = true,
  onSignOut,
}: AccountDialogProps) {
  const [sessions, setSessions] = useState<AccountSession[]>(DEFAULT_SESSIONS);
  const [activeTab, setActiveTab] = useState<'profile' | 'sessions'>('profile');

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const email = user?.email || 'user@kivo.app';
  const initials = displayName.charAt(0).toUpperCase();

  const handleRevokeSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  };

  const handleRevokeAllOther = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative w-full max-w-lg rounded-2xl border p-6 shadow-2xl transition-all duration-150 animate-in fade-in zoom-in-95 select-none overflow-hidden flex flex-col max-h-[90vh]',
          isDark
            ? 'bg-[#1c1c1c] border-white/[0.1] text-white shadow-black/80'
            : 'bg-white border-black/[0.1] text-neutral-900 shadow-neutral-500/20'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/[0.08] dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'size-8 rounded-lg flex items-center justify-center',
                isDark ? 'bg-white/[0.08] text-white' : 'bg-black/[0.05] text-black'
              )}
            >
              <User className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Account settings</h2>
              <p className="text-[11px] text-gray-400">Manage your profile and active login sessions</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={cn(
              'p-1.5 rounded-lg transition-colors cursor-pointer',
              isDark
                ? 'text-gray-400 hover:text-white hover:bg-white/[0.08]'
                : 'text-gray-500 hover:text-black hover:bg-black/[0.06]'
            )}
            title="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Minimal Tab Bar */}
        <div className="flex items-center gap-2 pt-3 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
              activeTab === 'profile'
                ? isDark
                  ? 'bg-white/[0.12] text-white'
                  : 'bg-black/[0.08] text-black'
                : isDark
                  ? 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                  : 'text-gray-600 hover:text-black hover:bg-black/[0.04]'
            )}
          >
            Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sessions')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5',
              activeTab === 'sessions'
                ? isDark
                  ? 'bg-white/[0.12] text-white'
                  : 'bg-black/[0.08] text-black'
                : isDark
                  ? 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                  : 'text-gray-600 hover:text-black hover:bg-black/[0.04]'
            )}
          >
            <span>Sessions</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-mono',
                isDark ? 'bg-white/10 text-gray-300' : 'bg-black/10 text-gray-700'
              )}
            >
              {sessions.length}
            </span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-xs">
          {activeTab === 'profile' ? (
            /* Profile Details Section */
            <div className="space-y-4">
              {/* Profile Card */}
              <div
                className={cn(
                  'p-4 rounded-xl border flex items-center gap-4',
                  isDark
                    ? 'bg-white/[0.03] border-white/[0.08]'
                    : 'bg-neutral-50 border-black/[0.08]'
                )}
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={displayName}
                    className="size-14 rounded-full object-cover border border-black/10"
                  />
                ) : (
                  <div className="size-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-sm">
                    {initials}
                  </div>
                )}

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="text-sm font-semibold truncate">{displayName}</div>
                  <div className="text-xs text-gray-400 truncate flex items-center gap-1.5">
                    <Mail className="size-3 shrink-0" />
                    <span>{email}</span>
                  </div>
                  <div className="pt-1.5 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="size-3" />
                      Google Connected
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Info Fields */}
              <div className="space-y-2.5">
                <div
                  className={cn(
                    'p-3 rounded-lg border flex items-center justify-between',
                    isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-black/[0.06] bg-white'
                  )}
                >
                  <div className="space-y-0.5">
                    <div className="text-[11px] text-gray-400 font-medium">Authentication Provider</div>
                    <div className="text-xs font-medium">Google OAuth 2.0</div>
                  </div>
                  <Shield className="size-4 text-emerald-400" />
                </div>

                <div
                  className={cn(
                    'p-3 rounded-lg border flex items-center justify-between',
                    isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-black/[0.06] bg-white'
                  )}
                >
                  <div className="space-y-0.5">
                    <div className="text-[11px] text-gray-400 font-medium">Workspace Status</div>
                    <div className="text-xs font-medium">Active Member</div>
                  </div>
                  <Globe className="size-4 text-blue-400" />
                </div>
              </div>
            </div>
          ) : (
            /* Active Sessions Section */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Devices where your account is currently signed in</span>
                {sessions.length > 1 && (
                  <button
                    type="button"
                    onClick={handleRevokeAllOther}
                    className="text-red-400 hover:text-red-300 transition-colors cursor-pointer text-[11px] font-medium"
                  >
                    Revoke all other
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {sessions.map((sess) => {
                  const isDesktop = sess.device.includes('PC') || sess.device.includes('Desktop');
                  const Icon = isDesktop ? Laptop : Smartphone;

                  return (
                    <div
                      key={sess.id}
                      className={cn(
                        'p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors',
                        sess.isCurrent
                          ? isDark
                            ? 'bg-white/[0.06] border-white/[0.12]'
                            : 'bg-neutral-50 border-black/[0.1]'
                          : isDark
                            ? 'bg-white/[0.02] border-white/[0.06]'
                            : 'bg-white border-black/[0.06]'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            'size-9 rounded-lg flex items-center justify-center shrink-0',
                            sess.isCurrent
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                              : isDark
                                ? 'bg-white/[0.05] text-gray-400'
                                : 'bg-black/[0.04] text-gray-600'
                          )}
                        >
                          <Icon className="size-4" />
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs truncate">{sess.device}</span>
                            {sess.isCurrent && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Current
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-400 truncate flex items-center gap-2">
                            <span>{sess.browser}</span>
                            <span>·</span>
                            <span>{sess.location}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-gray-500 font-mono hidden sm:inline">
                          {sess.lastActive}
                        </span>
                        {!sess.isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleRevokeSession(sess.id)}
                            className={cn(
                              'p-1.5 rounded-md transition-colors cursor-pointer text-gray-400 hover:text-red-400',
                              isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.05]'
                            )}
                            title="Revoke session"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-black/[0.08] dark:border-white/[0.08] text-xs">
          {onSignOut ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onSignOut();
              }}
              className="flex items-center gap-1.5 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
            >
              <LogOut className="size-3.5" />
              <span>Sign out</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className={cn(
              'px-4 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer',
              isDark
                ? 'bg-white/[0.1] hover:bg-white/[0.16] text-white'
                : 'bg-black/[0.06] hover:bg-black/[0.1] text-black'
            )}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default AccountDialog;
