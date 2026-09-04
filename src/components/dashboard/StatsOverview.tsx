'use client';

import React from 'react';
import { Activity, Clock, Layers } from 'lucide-react';
import { DashboardStats } from '@/types/database';

interface StatsOverviewProps {
  stats: DashboardStats;
  activeFilter?: string;
  onSelectStatFilter?: (filterType: string) => void;
}

export default function StatsOverview({ stats, activeFilter, onSelectStatFilter }: StatsOverviewProps) {
  const cards = [
    {
      id: 'total',
      title: 'TOTAL CASES',
      subtitle: 'Total cases',
      value: stats.totalCases,
      icon: Layers,
      borderColor: 'border-slate-800/90 hover:border-sky-500/50',
      bgColor: 'bg-[#0d1424]/85',
      textColor: 'text-white',
      glow: 'shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_25px_rgba(56,189,248,0.12)]',
      iconBg: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
      badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    },
    {
      id: 'active',
      title: 'ACTIVE CASES',
      subtitle: 'Active cases',
      value: stats.activeCases,
      icon: Activity,
      borderColor: 'border-slate-800/90 hover:border-amber-500/50',
      bgColor: 'bg-[#0d1424]/85',
      textColor: 'text-amber-400',
      glow: 'shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_25px_rgba(245,158,11,0.12)]',
      iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      id: 'sla',
      title: 'SLA CASES (>4H)',
      subtitle: 'Overdue SLA cases',
      value: stats.casesOlderThan4Hours,
      icon: Clock,
      borderColor: 'border-slate-800/90 hover:border-rose-500/50',
      bgColor: 'bg-[#0d1424]/85',
      textColor: 'text-rose-400',
      glow: 'shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_25px_rgba(244,63,94,0.15)]',
      iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 font-mono">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = activeFilter === card.id;
        return (
          <div
            key={card.id}
            onClick={() => onSelectStatFilter && onSelectStatFilter(card.id)}
            className={`p-4 rounded-2xl border ${card.borderColor} ${card.bgColor} ${card.glow} backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 ${
              onSelectStatFilter ? 'cursor-pointer' : ''
            } flex flex-col justify-between ${
              isSelected ? 'ring-2 ring-sky-500/60 bg-[#121c33]' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-300 tracking-wider uppercase">
                  {card.title}
                </span>
                <span className="text-[11px] text-slate-400 font-sans">{card.subtitle}</span>
              </div>
              <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <span className={`text-2xl sm:text-3xl font-black tracking-tight ${card.textColor}`}>
                {card.value.toLocaleString()}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold uppercase tracking-wider ${card.badgeColor}`}>
                SLA TRACKED
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
