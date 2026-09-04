'use client';

import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { Company, Province, FilterOptions } from '@/types/database';

interface FiltersBarProps {
  companies: Company[];
  provinces: Province[];
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  onReset: () => void;
}

export default function FiltersBar({
  companies,
  provinces,
  filters,
  setFilters,
  onReset,
}: FiltersBarProps) {
  return (
    <div className="p-4 bg-[#0d1424]/90 border border-slate-800/80 rounded-2xl backdrop-blur-xl font-mono text-xs shadow-[0_4px_20px_rgba(0,0,0,0.25)] space-y-3">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Live Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
            placeholder="Search SRC / Case ID, FMS, FDT, or description..."
            className="w-full pl-10 pr-3 py-2 bg-[#080d1a] border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-sans text-xs"
          />
        </div>

        {/* Reset Button */}
        <button
          onClick={onReset}
          className="px-4 py-2 bg-slate-800/60 border border-slate-700/60 hover:border-slate-500 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white font-bold flex items-center justify-center gap-1.5 transition-all shrink-0 active:scale-[0.98]"
          title="Reset Filters"
        >
          <RotateCcw className="w-3.5 h-3.5 text-sky-400" /> RESET FILTERS
        </button>
      </div>

      {/* Filter Dropdowns Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 font-mono">
        {/* Maintenance Filter */}
        <div className="relative">
          <select
            value={filters.maintenance}
            onChange={(e) => setFilters((prev) => ({ ...prev, maintenance: e.target.value }))}
            className="w-full px-3 py-2 bg-[#080d1a] border border-slate-700/60 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500 appearance-none cursor-pointer pr-8 truncate transition-colors"
          >
            <option value="ALL">All Maintenance</option>
            <option value="WNS">WNS</option>
            <option value="Zain Iraq">Zain Iraq</option>
            <option value="AsiaCell">AsiaCell</option>
            <option value="Korek Telecom">Korek Telecom</option>
          </select>
          <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
        </div>

        {/* Region / Governorate Filter */}
        <div className="relative">
          <select
            value={filters.provinceId}
            onChange={(e) => setFilters((prev) => ({ ...prev, provinceId: e.target.value }))}
            className="w-full px-3 py-2 bg-[#080d1a] border border-slate-700/60 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500 appearance-none cursor-pointer pr-8 truncate transition-colors"
          >
            <option value="ALL">All Regions</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.name_ar})
              </option>
            ))}
          </select>
          <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
        </div>

        {/* Escalation Filter */}
        <div className="relative">
          <select
            value={filters.escalation}
            onChange={(e) => setFilters((prev) => ({ ...prev, escalation: e.target.value }))}
            className="w-full px-3 py-2 bg-[#080d1a] border border-slate-700/60 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500 appearance-none cursor-pointer pr-8 truncate transition-colors"
          >
            <option value="ALL">All Escalations</option>
            <option value="OPEN">Escalation Open</option>
            <option value="CLOSED">Escalation Closed</option>
          </select>
          <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
        </div>

        {/* Work Status Filter */}
        <div className="relative">
          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            className="w-full px-3 py-2 bg-[#080d1a] border border-slate-700/60 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500 appearance-none cursor-pointer pr-8 truncate transition-colors"
          >
            <option value="ALL">All Work Statuses</option>
            <option value="Last Mile">Last Mile</option>
            <option value="In Progress">In Progress</option>
            <option value="Pending">Pending</option>
            <option value="Resolved">Resolved</option>
          </select>
          <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
        </div>

        {/* GR Request Filter */}
        <div className="relative">
          <select
            value={filters.grRequest}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                grRequest: e.target.value as FilterOptions['grRequest'],
              }))
            }
            className="w-full px-3 py-2 bg-[#080d1a] border border-slate-700/60 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500 appearance-none cursor-pointer pr-8 truncate transition-colors"
          >
            <option value="ALL">GR Request (All)</option>
            <option value="YES">GR Request: Yes</option>
            <option value="NO">GR Request: No</option>
          </select>
          <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
        </div>

        {/* Case Age Filter */}
        <div className="relative">
          <select
            value={filters.caseAge}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                caseAge: e.target.value as FilterOptions['caseAge'],
              }))
            }
            className="w-full px-3 py-2 bg-[#080d1a] border border-slate-700/60 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500 appearance-none cursor-pointer pr-8 truncate transition-colors"
          >
            <option value="ALL">All Case Ages</option>
            <option value="<1H">&lt; 1 Hour</option>
            <option value="1-2H">1–2 Hours</option>
            <option value="2-4H">2–4 Hours</option>
            <option value=">4H">&gt; 4 Hours</option>
            <option value=">8H">&gt; 8 Hours</option>
            <option value=">24H">&gt; 24 Hours</option>
          </select>
          <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
