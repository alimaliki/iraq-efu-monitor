'use client';

import React from 'react';
import { X, Bell, ShieldAlert, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { SystemNotification } from '@/types/database';

interface NotificationsDrawerProps {
  notifications: SystemNotification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAllRead: () => void;
}

export default function NotificationsDrawer({
  notifications,
  isOpen,
  onClose,
  onMarkAllRead,
}: NotificationsDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-[#080d1a]/95 border-l border-slate-800/80 backdrop-blur-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] font-mono flex flex-col animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-[#0d1424] border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Bell className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-wider">SYSTEM NOTIFICATIONS</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Action Sub-header */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-[#090f1d] border-b border-slate-800/80 text-[10px]">
        <span className="text-slate-400">{notifications.length} UNREAD ALERTS</span>
        <button
          onClick={onMarkAllRead}
          className="text-sky-400 font-bold hover:underline"
        >
          MARK ALL READ
        </button>
      </div>

      {/* Notifications List */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs font-sans">No new notifications</div>
        ) : (
          notifications.map((n) => {
            return (
              <div
                key={n.id}
                className={`p-3.5 bg-[#0d1424] border rounded-xl space-y-1 ${
                  n.type === 'CRITICAL' ? 'border-rose-500/40 shadow-sm' : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className={n.type === 'CRITICAL' ? 'text-rose-400' : 'text-sky-300'}>{n.title}</span>
                  <span className="text-[9px] text-slate-500">Just now</span>
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">{n.message}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
