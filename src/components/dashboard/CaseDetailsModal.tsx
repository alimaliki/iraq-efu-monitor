'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Radio,
  ExternalLink,
  MapPin,
  Building2,
  Clock,
  Send,
  UserCheck,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Flame,
  Trash2,
} from 'lucide-react';
import { EfuCase, Team, CaseStatus } from '@/types/database';
import { formatDate, formatTime, getEfuStatusStyle } from '@/lib/utils';
import { isCaseActive } from '@/lib/regionMapper';
import { getSLAData, SLAData } from '@/lib/slaCalculator';

interface CaseDetailsModalProps {
  caseData: EfuCase;
  teams: Team[];
  onClose: () => void;
  onUpdateStatus: (caseId: string, status: CaseStatus) => void;
  onAssignTeam: (caseId: string, teamId: string) => void;
  onAddNote: (caseId: string, noteText: string) => void;
  onCloseTask?: (caseId: string) => void;
  onDeleteCase?: (caseId: string) => void;
}

export default function CaseDetailsModal({
  caseData,
  teams,
  onClose,
  onUpdateStatus,
  onAssignTeam,
  onAddNote,
  onCloseTask,
  onDeleteCase,
}: CaseDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'NOTES'>('DETAILS');
  const [noteInput, setNoteInput] = useState('');
  const [notesList, setNotesList] = useState<string[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState(caseData.assigned_team_id || '');
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
  const style = getEfuStatusStyle(caseData.efu, caseData.priority, caseData.status);

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    onAddNote(caseData.id, noteInput.trim());
    setNotesList((prev) => [noteInput.trim(), ...prev]);
    setNoteInput('');
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tId = e.target.value;
    setSelectedTeamId(tId);
    if (tId) {
      onAssignTeam(caseData.id, tId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-mono animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#0a101f] border border-slate-700/80 rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0d1424] border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#080d1a] border border-slate-700/60 rounded-xl text-sky-400">
              <Radio
                className={`w-5 h-5 ${
                  caseData.priority === 'CRITICAL' || slaData.isOverdue ? 'text-rose-400 animate-pulse' : 'text-sky-400'
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-wider">
                  SRC: {caseData.case_id}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                    isActive
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  ESCALATION {caseData.escalation || (isActive ? 'OPEN' : 'CLOSED')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                FDT: <span className="text-slate-200 font-bold">{caseData.fdt}</span> | MAINTENANCE: <span className="text-slate-200 font-bold">{caseData.maintenance || 'WNS'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body & Tab Headers */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-slate-800/80 gap-4 text-xs font-bold">
            <button
              onClick={() => setActiveTab('DETAILS')}
              className={`pb-2.5 border-b-2 transition-all ${
                activeTab === 'DETAILS'
                  ? 'border-sky-400 text-sky-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              ORIGINAL SOURCE SPECIFICATIONS
            </button>
            <button
              onClick={() => setActiveTab('NOTES')}
              className={`pb-2.5 border-b-2 transition-all ${
                activeTab === 'NOTES'
                  ? 'border-sky-400 text-sky-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              FIELD OPERATOR NOTES ({notesList.length})
            </button>
          </div>

          {activeTab === 'DETAILS' ? (
            <div className="space-y-6">
              {/* Top SLA Live Timer Banner */}
              <div
                className={`p-4 rounded-xl border font-mono space-y-2.5 ${
                  slaData.isOverdue
                    ? 'bg-rose-950/40 border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                    : slaData.slaThreatLevel === 'CRITICAL'
                    ? 'bg-rose-950/30 border-rose-500/50'
                    : slaData.slaThreatLevel === 'WARNING'
                    ? 'bg-amber-950/30 border-amber-500/50'
                    : 'bg-[#0d1424] border-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-2 text-slate-200">
                    <Clock className="w-4 h-4 text-sky-400" /> 4-HOUR SLA TIMER STATUS
                  </span>
                  {caseData.fms_url && (
                    <a
                      href={caseData.fms_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(56,189,248,0.3)] text-[11px]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> OPEN FMS TASK
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-white/10">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">CREATED AT</span>
                    <span className="text-slate-200 font-bold">
                      {mounted ? `${formatDate(caseData.created_at)} ${formatTime(caseData.created_at)}` : ''}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">4-HOUR DEADLINE</span>
                    <span className="text-slate-200 font-bold">
                      {mounted ? `${formatDate(slaData.deadlineISO)} ${formatTime(slaData.deadlineISO)}` : ''}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">ELAPSED TIME</span>
                    <span className="text-white font-extrabold text-sm">
                      {mounted ? slaData.elapsedFormatted : '--:--:--'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">
                      {slaData.isOverdue ? 'OVERDUE BY' : 'TIME REMAINING'}
                    </span>
                    <span
                      className={`font-extrabold text-sm ${
                        slaData.isOverdue ? 'text-rose-400 animate-pulse' : 'text-emerald-300'
                      }`}
                    >
                      {mounted ? (slaData.isOverdue ? slaData.overdueFormatted : slaData.remainingFormatted) : '--:--:--'}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800 relative">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      slaData.isOverdue
                        ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.6)]'
                        : slaData.slaThreatLevel === 'CRITICAL'
                        ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                        : slaData.slaThreatLevel === 'WARNING'
                        ? 'bg-gradient-to-r from-amber-500 to-sky-400'
                        : 'bg-gradient-to-r from-sky-500 to-blue-500'
                    }`}
                    style={{ width: `${slaData.progressPct}%` }}
                  />
                </div>
              </div>

              {/* Status Actions */}
              <div className="flex flex-wrap gap-2 p-3 bg-[#0d1424] border border-slate-800/80 rounded-xl">
                <button
                  onClick={() => onUpdateStatus(caseData.id, 'ACKNOWLEDGED')}
                  className="px-3.5 py-1.5 bg-slate-800/80 border border-slate-700/80 text-slate-200 hover:bg-slate-700 hover:text-white rounded-lg text-xs font-bold transition-all"
                >
                  ACKNOWLEDGE
                </button>
                <button
                  onClick={() => onUpdateStatus(caseData.id, 'IN_PROGRESS')}
                  className="px-3.5 py-1.5 bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-black rounded-lg text-xs font-bold transition-all"
                >
                  IN PROGRESS
                </button>
                <button
                  onClick={() => {
                    onUpdateStatus(caseData.id, 'RESOLVED');
                    onClose();
                  }}
                  className="px-3.5 py-1.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> RESOLVE & ARCHIVE TASK
                </button>
              </div>

              {/* All Original Source Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-[#080d1a] border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">SRC (CASE ID)</span>
                  <span className="text-white font-bold">{caseData.case_id}</span>
                </div>

                <div className="p-3 bg-[#080d1a] border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">DEPARTMENT</span>
                  <span className="text-slate-200 font-bold">{caseData.department || 'Support'}</span>
                </div>

                <div className="p-3 bg-[#080d1a] border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">REGION</span>
                  <span className="text-slate-200 font-bold">
                    {caseData.region || 'Nasria'} ({caseData.province?.name || 'Dhi Qar'})
                  </span>
                </div>

                <div className="p-3 bg-[#080d1a] border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">FDT NODE</span>
                  <span className="text-sky-300 font-bold">{caseData.fdt}</span>
                </div>

                <div className="p-3 bg-[#080d1a] border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">EFU COUNT</span>
                  <span className="text-amber-400 font-extrabold text-sm">{caseData.efu}</span>
                </div>

                <div className="p-3 bg-[#080d1a] border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">MAINTENANCE (COMPANY)</span>
                  <span className="text-slate-200 font-bold">{caseData.maintenance || 'WNS'}</span>
                </div>

                <div className="p-3 bg-[#080d1a] border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">WORK STATUS</span>
                  <span className="text-slate-200 font-bold">{caseData.status}</span>
                </div>

                <div className="p-3 bg-[#080d1a] border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">ESCALATION</span>
                  <span className={isActive ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {caseData.escalation || (isActive ? 'Open' : 'Closed')}
                  </span>
                </div>

                <div className="p-3 bg-[#080d1a] border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">GR REQUEST</span>
                  <span className="text-slate-200 font-bold">
                    {caseData.gr_request ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              {/* FMS ID URL Box */}
              {caseData.fms_url && (
                <div className="p-3 bg-[#080d1a] border border-slate-800/80 rounded-xl space-y-1 text-xs">
                  <span className="text-[10px] text-slate-400 block font-bold">FMS TASK URL</span>
                  <a
                    href={caseData.fms_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 underline break-all hover:text-sky-300"
                  >
                    {caseData.fms_url}
                  </a>
                </div>
              )}

              {/* Description Block */}
              <div className="p-4 bg-[#080d1a] border border-slate-800/80 rounded-xl space-y-1 text-xs">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">
                  FULL TASK DESCRIPTION
                </span>
                <p className="text-slate-200 leading-relaxed font-sans">{caseData.description}</p>
              </div>

              {/* Assigned Team */}
              <div className="p-4 bg-[#0d1424] border border-slate-800/80 rounded-xl space-y-2 text-xs">
                <label className="text-slate-300 font-bold block flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-sky-400" /> ASSIGN MAINTENANCE TEAM
                </label>
                <select
                  value={selectedTeamId}
                  onChange={handleTeamChange}
                  className="w-full px-3 py-2 bg-[#080d1a] border border-slate-700/60 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="">Unassigned</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Close & Archive Task Button */}
              {isActive && onCloseTask && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to close and archive this incident task?')) {
                      onClose();
                      onCloseTask(caseData.id);
                    }
                  }}
                  className="w-full py-3 bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-mono font-bold text-xs rounded-xl shadow-[0_4px_20px_rgba(244,63,94,0.4)] hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                >
                  📦 CLOSE & ARCHIVE TASK
                </button>
              )}

              {onDeleteCase && (
                <button
                  onClick={() => {
                    if (confirm('Delete this case permanently? This action cannot be undone.')) {
                      onDeleteCase(caseData.id);
                    }
                  }}
                  className="w-full py-3 bg-rose-950/40 border border-rose-500/60 hover:bg-rose-600 text-rose-300 hover:text-white font-mono font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> DELETE CASE PERMANENTLY
                </button>
              )}
            </div>
          ) : (
            /* Field Notes Section */
            <div className="space-y-4 font-mono text-xs">
              <form onSubmit={handleAddNoteSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Enter field inspection note..."
                  className="flex-1 px-3 py-2 bg-[#080d1a] border border-slate-700/60 rounded-xl text-slate-100 focus:outline-none focus:border-sky-500 font-sans"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl flex items-center gap-1 transition-all"
                >
                  <Send className="w-4 h-4" /> ADD NOTE
                </button>
              </form>

              <div className="space-y-2">
                {notesList.length === 0 ? (
                  <div className="p-6 text-center text-slate-500">No field notes recorded yet</div>
                ) : (
                  notesList.map((n, idx) => (
                    <div key={idx} className="p-3 bg-[#080d1a] border border-slate-800/80 rounded-xl space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                        <span>OPERATOR</span>
                        <span>{new Date().toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-200 font-sans">{n}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
