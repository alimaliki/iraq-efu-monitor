'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { EfuCase, Province, Team, Company } from '@/types/database';
import { Archive, Search, RotateCcw, Clock, ExternalLink, Calendar, Trash2 } from 'lucide-react';
import { getClosedSLAData } from '@/lib/slaCalculator';
import { canManageUsers } from '@/lib/auth/rbac';
import { useTelegram } from '../telegram/TelegramProvider';

interface TaskArchiveViewProps {
  provinces: Province[];
  teams: Team[];
  companies: Company[];
  onSelectCase: (caseItem: EfuCase) => void;
  onRefreshTrigger?: () => void;
}

export default function TaskArchiveView({
  provinces,
  teams,
  companies,
  onSelectCase,
  onRefreshTrigger,
}: TaskArchiveViewProps) {
  const { user } = useTelegram();
  const isDev = canManageUsers(user?.role);

  const [cases, setCases] = useState<EfuCase[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [maintenanceFilter, setMaintenanceFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchArchivedCases = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (regionFilter !== 'ALL') params.append('region', regionFilter);
      if (maintenanceFilter !== 'ALL') params.append('maintenance', maintenanceFilter);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (searchQuery.trim()) params.append('query', searchQuery.trim());

      const res = await fetch(`/api/archive?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setCases(json.cases || []);
      }
    } catch (err) {
      console.error('Error fetching archive:', err);
    } finally {
      setIsLoading(false);
    }
  }, [regionFilter, maintenanceFilter, dateFrom, dateTo, searchQuery]);

  useEffect(() => {
    fetchArchivedCases();
  }, [fetchArchivedCases]);

  // Restore Handler (Developer Only)
  const handleRestore = async (e: React.MouseEvent, caseId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to restore this archived task back to Active status?')) return;

    try {
      setRestoringId(caseId);
      const res = await fetch(`/api/cases/${caseId}/restore`, { method: 'POST' });
      const json = await res.json();

      if (json.success) {
        await fetchArchivedCases();
        if (onRefreshTrigger) onRefreshTrigger();
      }
    } catch (err) {
      console.error('Restore error:', err);
    } finally {
      setRestoringId(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, caseId: string) => {
    e.stopPropagation();
    if (!confirm('Delete this archived case permanently? This action cannot be undone.')) return;

    try {
      setDeletingId(caseId);
      const res = await fetch(`/api/cases/${caseId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete archived case');
      }

      await fetchArchivedCases();
      onRefreshTrigger?.();
    } catch (err) {
      console.error('Delete archive error:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete archived case');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4 font-mono text-xs select-none">
      {/* Archive Header Banner */}
      <div className="p-5 bg-[#0d1424]/90 border border-slate-800/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-[0_4px_25px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wider">
              TASK ARCHIVE & HISTORICAL RECORDS
            </h2>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Completed and closed case records with historical SLA timer audits.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <div className="px-3.5 py-1.5 bg-[#080d1a] border border-slate-700/60 rounded-xl text-slate-200 font-bold">
            ARCHIVED RECORDS: <span className="text-sky-400">{cases.length}</span>
          </div>
        </div>
      </div>

      {/* Filter & Live Search Toolbar */}
      <div className="p-4 bg-[#0d1424]/90 border border-slate-800/80 rounded-2xl space-y-3 backdrop-blur-xl shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Live Search Input */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-sky-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search SRC, FMS ID, FDT, Region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#080d1a] border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-sans text-xs"
            />
          </div>

          {/* Region Filter */}
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#080d1a] border border-slate-700/60 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="ALL">ALL REGIONS</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name} ({p.name_ar})
              </option>
            ))}
          </select>

          {/* Maintenance Company Filter */}
          <select
            value={maintenanceFilter}
            onChange={(e) => setMaintenanceFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#080d1a] border border-slate-700/60 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="ALL">ALL MAINTENANCE</option>
            {companies.map((c) => (
              <option key={c.id} value={c.code}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>

          {/* Reset Filters */}
          <button
            onClick={() => {
              setSearchQuery('');
              setRegionFilter('ALL');
              setMaintenanceFilter('ALL');
              setDateFrom('');
              setDateTo('');
            }}
            className="px-3 py-1.5 bg-slate-800/60 border border-slate-700/60 text-slate-300 hover:text-white font-bold rounded-xl hover:bg-slate-700 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sky-400" /> RESET
          </button>
        </div>

        {/* Date Range Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 text-slate-300 font-bold">
            <Calendar className="w-3.5 h-3.5 text-sky-400" /> DATE RANGE:
          </span>
          <div className="flex items-center gap-1.5">
            <span>FROM:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2.5 py-1 bg-[#080d1a] border border-slate-700/60 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 text-xs"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span>TO:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2.5 py-1 bg-[#080d1a] border border-slate-700/60 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Historical Data Table */}
      <div className="bg-[#0d1424]/90 border border-slate-800/80 rounded-2xl overflow-x-auto shadow-[0_4px_25px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 animate-pulse font-mono">
            Loading historical task archive...
          </div>
        ) : cases.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-mono">
            No archived tasks matched the selected search parameters.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#080d1a] text-slate-400 border-b border-slate-800/80 text-[10px] uppercase tracking-wider font-bold">
                <th className="p-3.5">SRC / TASK</th>
                <th className="p-3.5">REGION</th>
                <th className="p-3.5">FDT</th>
                <th className="p-3.5">DESCRIPTION</th>
                <th className="p-3.5 text-center">EFU</th>
                <th className="p-3.5">CREATED AT</th>
                <th className="p-3.5">CLOSED AT</th>
                <th className="p-3.5">SLA DURATION</th>
                <th className="p-3.5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {cases.map((c) => {
                const sla = getClosedSLAData(c.created_at, c.closed_at || c.updated_at);

                return (
                  <tr
                    key={c.id}
                    onClick={() => onSelectCase(c)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="p-3.5 font-bold text-sky-400">
                      <div className="flex items-center gap-1.5">
                        <span>{c.case_id}</span>
                        {c.fms_url && (
                          <a
                            href={c.fms_url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-sky-400 hover:text-sky-200"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-200">{c.region || 'Nasria'}</td>
                    <td className="p-3.5 font-mono text-slate-300">{c.fdt}</td>
                    <td className="p-3.5 max-w-[200px] truncate text-slate-300 font-sans" title={c.description}>
                      {c.description}
                    </td>
                    <td className="p-3.5 text-center font-bold text-amber-400">{c.efu}</td>
                    <td className="p-3.5 text-slate-400 text-[10px]">
                      {new Date(c.created_at).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-3.5 text-slate-400 text-[10px]">
                      {c.closed_at
                        ? new Date(c.closed_at).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${
                          sla.slaBreached
                            ? 'bg-rose-500/15 text-rose-400 border-rose-500/40'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {sla.durationFormatted} ({sla.statusBadge})
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isDev && (
                          <button
                            onClick={(e) => handleRestore(e, c.id)}
                            disabled={restoringId === c.id || deletingId === c.id}
                            className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-[10px] font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
                          >
                            RESTORE
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(e, c.id)}
                          disabled={deletingId === c.id || restoringId === c.id}
                          className="px-2.5 py-1 bg-rose-950/40 border border-rose-500/50 rounded-lg text-[10px] font-bold text-rose-300 hover:bg-rose-600 hover:text-white transition-all inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> DELETE
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
