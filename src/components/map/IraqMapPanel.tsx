'use client';

import React, { useState } from 'react';
import { Maximize2, Minimize2, ShieldAlert, Crosshair } from 'lucide-react';
import IraqSvgMap from './IraqSvgMap';
import ProvinceModal from './ProvinceModal';
import { ProvinceStat } from '@/types/database';

interface IraqMapPanelProps {
  provinceStats: ProvinceStat[];
}

export default function IraqMapPanel({ provinceStats }: IraqMapPanelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(null);

  const selectedStat = provinceStats.find((s) => s.provinceId === selectedProvinceId) || null;

  return (
    <div
      className={`relative flex flex-col bg-[#0d1424]/90 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-xl transition-all duration-300 shadow-[0_4px_25px_rgba(0,0,0,0.3)] ${
        isFullscreen ? 'fixed inset-2 z-50 bg-[#070b14]' : 'w-full h-full min-h-[500px]'
      }`}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-[#090f1d]/90 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Crosshair className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-mono font-bold tracking-wider text-white uppercase">
              IRAQ THREAT MAP
            </h2>
            <p className="text-[10px] text-slate-400 font-sans">خريطة المحافظات ورصد التهديدات المباشرة</p>
          </div>
        </div>

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold text-slate-300 bg-slate-800/60 border border-slate-700/60 rounded-xl hover:bg-slate-700 hover:text-white transition-all shadow-sm active:scale-[0.98]"
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-3.5 h-3.5 text-sky-400" /> EXIT FULLSCREEN
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-sky-400" /> FULLSCREEN
            </>
          )}
        </button>
      </div>

      {/* Map Graphic Area */}
      <div className="relative flex-1 flex items-center justify-center p-3 bg-gradient-to-b from-[#080d1a] to-[#0b1222] overflow-hidden">
        {/* CONTINUOUS FULL CONTAINER-WIDTH TOP-TO-BOTTOM SCANNER BEAM SWEEP */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-10 select-none">
          <div className="map-container-scan-beam absolute left-0 right-0 h-28 pointer-events-none">
            {/* Trailing Soft Scan Beam Gradient Shadow */}
            <div className="w-full h-full bg-gradient-to-t from-sky-400/15 via-sky-400/05 to-transparent" />
            {/* Main Precision Laser Beam Line Spanning 100% of Map Container Width */}
            <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-sky-400 via-sky-200 to-transparent shadow-[0_0_15px_rgba(56,189,248,0.8)]" />
          </div>
        </div>

        <IraqSvgMap
          provinceStats={provinceStats}
          selectedProvinceId={selectedProvinceId}
          onSelectProvince={(id) => setSelectedProvinceId(id)}
        />

        {/* Legend Overlay at Bottom Right */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 p-3 bg-[#080d1a]/95 border border-slate-700/60 rounded-xl text-[10px] font-mono backdrop-blur-xl select-none shadow-lg">
          <div className="text-slate-300 font-bold tracking-wider uppercase mb-1 flex items-center gap-1.5 text-[11px]">
            <ShieldAlert className="w-3.5 h-3.5 text-sky-400" /> THREAT LEGEND
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
            <span className="text-slate-200 font-semibold">&gt;200 EFU / +4H SLA</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
            <span className="text-slate-300">AFFECTED USERS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
            <span className="text-slate-400">NO OPEN EFU</span>
          </div>
        </div>
      </div>

      {/* Selected Province Details Overlay Modal */}
      {selectedStat && (
        <ProvinceModal stat={selectedStat} onClose={() => setSelectedProvinceId(null)} />
      )}
    </div>
  );
}
