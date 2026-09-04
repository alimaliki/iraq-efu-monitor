'use client';

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, MapPin, Bell, User, Archive } from 'lucide-react';
import { useTelegram } from '../telegram/TelegramProvider';
import { canViewProfile, canViewArchive } from '@/lib/auth/rbac';

interface TabNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function TabNav({ activeTab, setActiveTab }: TabNavProps) {
  const { user } = useTelegram();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDev = mounted && canViewProfile(user?.role || 'MEMBER');
  const isArchiveAllowed = mounted && canViewArchive(user?.role || 'MEMBER');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cases', label: 'Cases', icon: FileText },
    { id: 'map', label: 'Map', icon: MapPin },
    { id: 'notifications', label: 'Alerts', icon: Bell },
    ...(isArchiveAllowed ? [{ id: 'archive', label: 'Archive', icon: Archive }] : []),
    ...(isDev ? [{ id: 'profile', label: 'Profile', icon: User }] : []),
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080d1a]/95 border-t border-slate-800/80 backdrop-blur-xl px-2 py-2 select-none shadow-[0_-4px_24px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-around font-mono text-[10px]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-white font-bold bg-gradient-to-r from-sky-500/20 to-blue-500/20 border border-sky-500/40 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
