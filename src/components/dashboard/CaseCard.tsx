'use client';

import React, { useState, useEffect } from 'react';
import { Radio, ExternalLink, MapPin, Building2, Cpu, Clock, AlertTriangle, Flame } from 'lucide-react';
import { EfuCase } from '@/types/database';
import { formatDate, formatTime, getEfuStatusStyle } from '@/lib/utils';
import { isCaseActive } from '@/lib/regionMapper';
import { getSLAData, SLAData } from '@/lib/slaCalculator';

interface CaseCardProps {
  caseData: EfuCase;
  onSelect: (caseData: EfuCase) => void;
}

export default function CaseCard({ caseData, onSelect }: CaseCardProps) {
  const [mounted, setMounted] = useState(false);
  
  const isClosedOrResolved =
    caseData.status?.toUpperCase() === 'RESOLVED' ||
    caseData.status?.toUpperCase() === 'CLOSED' ||
    caseData.escalation?.toUpperCase() === 'CLOSED' ||
    !!caseData.closed_at ||
    !!caseData.archived_at;

  const closedAtTime = caseData.closed_at || caseData.archived_at || (isClosedOrResolved ? caseData.updated_at : null);

  const [slaData, setSlaData] = useState<SLAData>(() =>
    getSLAData(caseData.created_at, undefined, closedAtTime)
  );

  // Live 1-Second Timer Interval (Client-side only to prevent hydration mismatch)
  useEffect(() => {
    setMounted(true);
    setSlaData(getSLAData(caseData.created_at, undefined, closedAtTime));

    if (isClosedOrResolved) return; // Freeze timer for completed/archived tasks!

    const timer = setInterval(() => {
      setSlaData(getSLAData(caseData.created_at, undefined, closedAtTime));
    }, 1000);

    return () => clearInterval(timer);
  }, [caseData.created_at, closedAtTime, isClosedOrResolved]);

  const isActive = isCaseActive(caseData);

  return (
    <div
      onClick={() => onSelect(caseData)}
      className="group relative p-4 rounded-2xl border border-slate-800/90 bg-[#0d1424]/90 hover:bg-[#101b30] hover:border-sky-500/40 backdrop-blur-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.35)] select-none"
    >
      {/* Top Header Row: SRC / Case ID + EFU + ESCALATION */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${caseData.priority === 'CRITICAL' || slaData.isOverdue ? 'bg-rose-500/10 text-rose-400' : 'bg-sky-500/10 text-sky-400'}`}>
            <Radio className={`w-3.5 h-3.5 ${caseData.priority === 'CRITICAL' || slaData.isOverdue ? 'animate-pulse' : ''}`} />
          </div>
          <span className="text-sm font-bold font-mono text-white tracking-wider group-hover:text-sky-300 transition-colors">
            {caseData.case_id}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* EFU Badge */}
          <div className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-sky-500/10 text-sky-300 border border-sky-500/30">
            EFU {caseData.efu}
          </div>

          {/* Escalation Badge */}
          <div
            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
              isActive
                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            ESCALATION {caseData.escalation || (isActive ? 'OPEN' : 'CLOSED')}
          </div>
        </div>
      </div>

      {/* Grid Meta Specs Row: MAINTENANCE, REGION, FDT */}
      <div className="grid grid-cols-3 gap-2 my-3 text-[11px] font-mono">
        <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/60">
          <span className="text-slate-400 text-[9px] uppercase tracking-widest block flex items-center gap-1 mb-0.5">
            <Building2 className="w-3 h-3 text-sky-400" /> MAINTENANCE
          </span>
          <span className="font-bold text-slate-200 truncate block">{caseData.maintenance || caseData.company?.name || 'UNSPECIFIED'}</span>
        </div>

        <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/60">
          <span className="text-slate-400 text-[9px] uppercase tracking-widest block flex items-center gap-1 mb-0.5">
            <MapPin className="w-3 h-3 text-sky-400" /> REGION
          </span>
          <span className="font-bold text-slate-200 truncate block">
            {caseData.region || caseData.province?.name || 'Nasria'}
          </span>
        </div>

        <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/60">
          <span className="text-slate-400 text-[9px] uppercase tracking-widest block flex items-center gap-1 mb-0.5">
            <Cpu className="w-3 h-3 text-sky-400" /> FDT
          </span>
          <span className="font-bold text-sky-300 truncate block">{caseData.fdt}</span>
        </div>
      </div>

      {/* Description */}
      <div className="text-xs text-slate-300 bg-[#080d1a]/80 p-2.5 rounded-xl border border-slate-800/70 mb-3 line-clamp-2 leading-relaxed">
        <span className="text-slate-400 font-bold mr-1 font-mono text-[10px]">DESC:</span>
        {caseData.description}
      </div>

      {/* SLA 4-Hour Timer Grid (Elapsed vs Time Remaining / Overdue By) */}
      <div className="p-2.5 bg-[#080d1a]/90 rounded-xl border border-slate-800/80 mb-3 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono">
          {/* Elapsed Time */}
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[10px] text-slate-400 font-bold">ELAPSED:</span>
            <span className="font-bold text-slate-200">
              {mounted ? slaData.elapsedFormatted : '--:--:--'}
            </span>
          </div>

          {/* SLA Threat Status / Countdown */}
          <div className="flex items-center gap-1.5">
            {slaData.isOverdue ? (
              <div className="flex items-center gap-1 text-rose-400 font-bold">
                <Flame className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                <span className="text-[10px]">OVERDUE BY:</span>
                <span className="font-mono text-rose-300 font-extrabold">
                  {mounted ? slaData.overdueFormatted : '00:00:00'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-emerald-400 font-bold">
                <span className="text-[10px] text-slate-400">REMAINING:</span>
                <span className="font-mono text-emerald-300 font-bold">
                  {mounted ? slaData.remainingFormatted : '--:--:--'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 4-Hour SLA Progress Bar */}
        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800 relative">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              slaData.isOverdue
                ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.6)]'
                : slaData.slaThreatLevel === 'CRITICAL'
                ? 'bg-gradient-to-r from-rose-500 to-amber-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                : slaData.slaThreatLevel === 'WARNING'
                ? 'bg-gradient-to-r from-amber-500 to-sky-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                : 'bg-gradient-to-r from-sky-500 to-blue-500 shadow-[0_0_8px_rgba(56,189,248,0.5)]'
            }`}
            style={{ width: `${slaData.progressPct}%` }}
          />
        </div>
      </div>

      {/* Footer Row: Created At & FMS TASK Button */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-mono">
        <div>
          <span>CREATED: </span>
          <span className="text-slate-200 font-bold">
            {mounted ? formatDate(caseData.created_at) : ''} {mounted ? formatTime(caseData.created_at) : ''}
          </span>
        </div>

        {caseData.fms_url && (
          <a
            href={caseData.fms_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-500/10 border border-sky-500/30 hover:bg-sky-500 hover:text-white text-sky-300 rounded-lg text-[10px] font-bold transition-all shadow-sm"
          >
            <ExternalLink className="w-3 h-3" /> OPEN FMS TASK
          </a>
        )}
      </div>
    </div>
  );
}
