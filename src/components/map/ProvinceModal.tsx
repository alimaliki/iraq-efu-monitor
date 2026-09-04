'use client';

import React from 'react';
import { X, AlertTriangle, Users, Activity, Clock, ShieldCheck, Flame } from 'lucide-react';
import { ProvinceStat } from '@/types/database';
import { formatDate, formatTime } from '@/lib/utils';

interface ProvinceModalProps {
  stat: ProvinceStat;
  onClose: () => void;
}

export default function ProvinceModal({ stat, onClose }: ProvinceModalProps) {
  return (
    <div className="absolute inset-x-3 bottom-3 z-30 p-4 bg-[#080d1a]/95 border border-slate-700/80 rounded-2xl shadow-[0_8px_35px_rgba(0,0,0,0.6)] backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-4 duration-200 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div>
          <h3 className="text-base font-bold text-white tracking-wider flex items-center gap-2">
            {stat.provinceName.toUpperCase()} ({stat.provinceNameAr})
          </h3>
          <p className="text-[10px] text-slate-400 font-sans mt-0.5">مؤشرات ومعلومات المحافظة وحالات الـ EFU الحالية</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Dynamic Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3 text-xs">
        {/* Active Cases */}
        <div className="p-3 bg-[#0d1424] border border-slate-800/80 rounded-xl">
          <div className="text-[9px] text-slate-400 flex items-center gap-1 font-bold">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> ACTIVE CASES
          </div>
          <div className="text-base font-bold text-slate-100 mt-1">{stat.activeCases}</div>
        </div>

        {/* Total EFU */}
        <div className="p-3 bg-[#0d1424] border border-slate-800/80 rounded-xl">
          <div className="text-[9px] text-slate-400 flex items-center gap-1 font-bold">
            <Activity className="w-3 h-3 text-sky-400" /> TOTAL EFU
          </div>
          <div className="text-base font-bold text-sky-400 mt-1">{stat.totalEFU}</div>
        </div>

        {/* Affected Users */}
        <div className="p-3 bg-[#0d1424] border border-slate-800/80 rounded-xl">
          <div className="text-[9px] text-slate-400 flex items-center gap-1 font-bold">
            <Users className="w-3 h-3 text-blue-400" /> AFFECTED USERS
          </div>
          <div className="text-base font-bold text-slate-200 mt-1">{stat.affectedUsers}</div>
        </div>

        {/* Critical Cases */}
        <div className="p-3 bg-[#0d1424] border border-rose-500/30 rounded-xl">
          <div className="text-[9px] text-rose-400 flex items-center gap-1 font-bold">
            <Flame className="w-3 h-3 text-rose-400" /> CRITICAL CASES
          </div>
          <div className="text-base font-bold text-rose-400 mt-1">{stat.criticalCases}</div>
        </div>

        {/* Highest EFU */}
        <div className="p-3 bg-[#0d1424] border border-slate-800/80 rounded-xl">
          <div className="text-[9px] text-slate-400 flex items-center gap-1 font-bold">
            <ShieldCheck className="w-3 h-3 text-amber-400" /> HIGHEST EFU
          </div>
          <div className="text-base font-bold text-amber-400 mt-1">{stat.highestEFU}</div>
        </div>
      </div>

      {/* Footer Meta */}
      <div className="flex items-center justify-between mt-3 text-[10px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-sky-400" /> LAST CASE:{' '}
          {stat.lastCaseTime ? `${formatDate(stat.lastCaseTime)} ${formatTime(stat.lastCaseTime)}` : 'None'}
        </span>
        <span className="text-slate-300 font-semibold">TOTAL RECORDED: {stat.caseCount}</span>
      </div>
    </div>
  );
}
