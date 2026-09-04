'use client';

import React from 'react';
import { Activity, Radio, Inbox } from 'lucide-react';
import CaseCard from './CaseCard';
import { EfuCase } from '@/types/database';

interface PriorityStreamProps {
  cases: EfuCase[];
  onSelectCase: (caseData: EfuCase) => void;
  isLoading?: boolean;
}

export default function PriorityStream({
  cases,
  onSelectCase,
  isLoading = false,
}: PriorityStreamProps) {
  const activeCasesCount = cases.length;

  return (
    <div className="flex flex-col gap-3 font-mono">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-[#0d1424]/90 border border-slate-800/80 rounded-2xl backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wider uppercase">
              ACTIVE PRIORITY STREAM
            </h2>
            <p className="text-[10px] text-slate-400 font-sans">Currently open and active incidents and cases</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* LIVE Indicator Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 border border-rose-500/30 rounded-full">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping opacity-75" />
            <span className="text-[10px] font-bold text-rose-400 tracking-wider uppercase">LIVE</span>
          </div>

          <span className="text-xs font-bold text-sky-300 bg-sky-500/10 border border-sky-500/30 px-3 py-1 rounded-xl">
            {activeCasesCount} {activeCasesCount === 1 ? 'case' : 'cases'}
          </span>
        </div>
      </div>

      {/* Case List or Skeletons */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-5 rounded-2xl border border-slate-800/80 bg-[#0d1424]/40 animate-pulse h-36"
            />
          ))}
        </div>
      ) : cases.length === 0 ? (
        <div className="p-8 text-center bg-[#0d1424]/60 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center gap-2">
          <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-slate-500">
            <Inbox className="w-8 h-8" />
          </div>
          <p className="text-sm font-bold text-slate-200 mt-2">NO ACTIVE EFU CASES MATCHED</p>
          <p className="text-xs text-slate-400 font-sans">All systems are within standards, or no results match the current filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => (
            <CaseCard key={c.id} caseData={c} onSelect={onSelectCase} />
          ))}
        </div>
      )}
    </div>
  );
}
