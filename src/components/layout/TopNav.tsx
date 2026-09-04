'use client';

import React, { useEffect, useState } from 'react';
import { Shield, Bell, User as UserIcon, Plus } from 'lucide-react';
import { useTelegram } from '../telegram/TelegramProvider';
import { canViewProfile, canViewArchive } from '@/lib/auth/rbac';

interface TopNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadNotificationsCount?: number;
  onOpenNotifications: () => void;
  onOpenNewCaseModal: () => void;
}

export default function TopNav({
  activeTab,
  setActiveTab,
  unreadNotificationsCount = 2,
  onOpenNotifications,
  onOpenNewCaseModal,
}: TopNavProps) {
  const { user } = useTelegram();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDev = mounted && canViewProfile(user?.role || 'MEMBER');
  const isArchiveAllowed = mounted && canViewArchive(user?.role || 'MEMBER');

  // Navigation Items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'cases', label: 'Cases' },
    { id: 'map', label: 'Map' },
    { id: 'notifications', label: 'Notifications' },
    ...(isArchiveAllowed ? [{ id: 'archive', label: 'Archive' }] : []),
    ...(isDev ? [{ id: 'profile', label: 'Profile' }] : []),
  ];

  // Sanitized display name (NO Telegram IDs, DB UUIDs or backend info)
  const displayName = mounted && user
    ? user.username
      ? `@${user.username}`
      : `${user.first_name || ''} ${user.last_name || ''}`.trim()
    : 'Operations Agent';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#080d1a]/85 border-b border-slate-800/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.4)] select-none">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand Header */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('dashboard')}>
          <div className="relative p-2.5 bg-gradient-to-br from-slate-900 to-[#0e1628] border border-slate-700/70 rounded-xl shadow-[0_0_15px_rgba(56,189,248,0.15)] group-hover:border-sky-500/50 transition-all">
            <Shield className="w-5 h-5 text-sky-400" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-sky-400 rounded-full animate-ping opacity-75" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-100 to-sky-400">
              IRAQ EFU MONITOR
            </h1>
            <p className="text-[10px] font-mono text-slate-400 tracking-widest uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              OPERATIONS CONTROL CENTER
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-[#0d1424]/90 border border-slate-800/90 p-1 rounded-xl font-mono text-xs shadow-inner">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3.5 py-1.5 rounded-lg transition-all duration-200 font-semibold ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_0_15px_rgba(56,189,248,0.35)]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Actions: + NEW CASE, Bell, User Badge */}
        <div className="flex items-center gap-2.5">
          {/* Prominent + NEW CASE Button */}
          <button
            onClick={onOpenNewCaseModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-mono font-bold text-xs rounded-xl shadow-[0_0_16px_rgba(56,189,248,0.3)] hover:shadow-[0_0_20px_rgba(56,189,248,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> NEW CASE
          </button>

          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 bg-[#0e1628] border border-slate-700/60 rounded-xl text-slate-300 hover:text-white hover:border-slate-500 transition-all shadow-sm"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-mono font-bold text-white bg-rose-500 rounded-full border border-slate-900 shadow-[0_0_8px_rgba(244,63,94,0.8)]">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* User Identity Badge (No IDs, DB metadata, or technical info) */}
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-[#0e1628] border border-slate-700/60 rounded-xl shadow-sm">
            <div className="relative">
              {mounted && user?.photo_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={user.photo_url}
                  alt={displayName}
                  className="w-7 h-7 rounded-full border border-sky-400/60 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
              {/* Online Indicator */}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0e1628] rounded-full shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
            </div>

            <div className="flex flex-col text-left">
              <span className="text-xs font-mono font-bold text-slate-200 max-w-[120px] truncate">
                {displayName}
              </span>
              <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-tighter flex items-center gap-1">
                ONLINE
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
