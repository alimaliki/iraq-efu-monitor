'use client';

import React, { useState } from 'react';
import {
  IRAQ_GOVERNORATES_FEATURES,
  GovernorateGeoFeature,
  getSvgPathForGovernorate,
} from '@/lib/map/iraqGeoData';
import { ProvinceStat } from '@/types/database';
import { ZoomIn, ZoomOut, RotateCcw, Radar } from 'lucide-react';

interface IraqSvgMapProps {
  provinceStats: ProvinceStat[];
  selectedProvinceId: string | null;
  onSelectProvince: (provinceId: string) => void;
}

export default function IraqSvgMap({
  provinceStats,
  selectedProvinceId,
  onSelectProvince,
}: IraqSvgMapProps) {
  // Zoom & Pan Map View Box State
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoveredGov, setHoveredGov] = useState<GovernorateGeoFeature | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.3, 2.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.3, 0.8));
  const handleResetZoom = () => setZoomLevel(1);

  // Status color resolver for each governorate based on dynamic database stats
  const getGovernorateStatus = (provId: string) => {
    const governorate = IRAQ_GOVERNORATES_FEATURES.find((gov) => gov.id === provId);
    const stat = provinceStats.find(
      (s) => s.provinceId === provId || s.provinceCode?.toLowerCase() === governorate?.code.toLowerCase()
    );
    if (!stat) return 'CYAN';
    return stat.statusColor;
  };

  const getGovernorateStyle = (status: 'RED' | 'ORANGE' | 'CYAN', isSelected: boolean) => {
    if (isSelected) {
      return {
        fill: 'rgba(56, 189, 248, 0.45)',
        stroke: '#ffffff',
        strokeWidth: 2.8,
        filter: 'drop-shadow(0px 0px 14px rgba(56, 189, 248, 0.9))',
      };
    }

    switch (status) {
      case 'RED':
        return {
          fill: 'rgba(244, 63, 94, 0.38)',
          stroke: '#f43f5e',
          strokeWidth: 2.0,
          filter: 'drop-shadow(0px 0px 10px rgba(244, 63, 94, 0.6))',
        };
      case 'ORANGE':
        return {
          fill: 'rgba(245, 158, 11, 0.32)',
          stroke: '#f59e0b',
          strokeWidth: 1.6,
          filter: 'drop-shadow(0px 0px 6px rgba(245, 158, 11, 0.4))',
        };
      case 'CYAN':
      default:
        return {
          fill: 'rgba(14, 24, 42, 0.75)',
          stroke: '#243b61',
          strokeWidth: 1.2,
          filter: 'none',
        };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Viewport calculation for zoom
  const viewBoxWidth = 800 / zoomLevel;
  const viewBoxHeight = 800 / zoomLevel;
  const viewBoxX = (800 - viewBoxWidth) / 2;
  const viewBoxY = (800 - viewBoxHeight) / 2;

  const hoveredStat = hoveredGov
    ? provinceStats.find(
        (s) => s.provinceId === hoveredGov.id || s.provinceCode?.toLowerCase() === hoveredGov.code.toLowerCase()
      )
    : null;

  return (
    <div className="relative w-full h-full min-h-[440px] flex items-center justify-center p-2 select-none overflow-hidden font-mono">
      {/* Top Left Live Scan Status Indicator */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2 px-3 py-1.5 bg-[#080d1a]/95 border border-slate-700/60 rounded-xl backdrop-blur-xl text-[10px] text-slate-300 font-bold shadow-md">
        <Radar className="w-3.5 h-3.5 text-sky-400 animate-spin-slow" />
        <span className="tracking-wider uppercase text-slate-200">RADAR ACTIVE</span>
      </div>

      {/* Zoom Control Buttons Overlay */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1 bg-[#080d1a]/95 border border-slate-700/60 p-1 rounded-xl backdrop-blur-xl shadow-md">
        <button
          onClick={handleZoomIn}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* SVG Map Graphic */}
      <svg
        viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`}
        onMouseMove={handleMouseMove}
        className="w-full h-full max-h-[580px] transition-all duration-300 ease-out relative"
      >
        <defs>
          {/* Radial Background Glow */}
          <radialGradient id="iraqMapGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#080d1a" stopOpacity="0" />
          </radialGradient>

          {/* Tactical Radar Grid Pattern */}
          <pattern id="tacticalGridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(56, 189, 248, 0.05)" strokeWidth="0.8" strokeDasharray="3,3" />
          </pattern>
        </defs>

        {/* Tactical Dotted Radar Grid Overlay */}
        <rect x="0" y="0" width="800" height="800" fill="url(#tacticalGridPattern)" pointerEvents="none" />

        {/* Outer Background Radial Glow */}
        <circle cx="400" cy="400" r="380" fill="url(#iraqMapGlow)" pointerEvents="none" />

        {/* 18 Governorate Polygons */}
        <g>
          {IRAQ_GOVERNORATES_FEATURES.map((gov) => {
            const status = getGovernorateStatus(gov.id);
            const isSelected = selectedProvinceId === gov.id;
            const style = getGovernorateStyle(status, isSelected);
            const pathD = getSvgPathForGovernorate(gov);

            const pulseClass =
              !isSelected && status === 'RED'
                ? 'province-pulse-red'
                : !isSelected && status === 'ORANGE'
                ? 'province-pulse-orange'
                : '';

            return (
              <g
                key={gov.id}
                className="group cursor-pointer"
                onClick={() => onSelectProvince(gov.id)}
                onMouseEnter={() => setHoveredGov(gov)}
                onMouseLeave={() => setHoveredGov(null)}
              >
                <path
                  d={pathD}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth={style.strokeWidth}
                  style={{ filter: style.filter }}
                  className={`transition-all duration-200 hover:fill-sky-400/50 hover:stroke-white hover:drop-shadow-[0_0_15px_rgba(56,189,248,0.8)] ${pulseClass}`}
                />

                {/* Governorate Code Label inside shape */}
                <text
                  x={gov.centroidX}
                  y={gov.centroidY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={`text-[11px] font-mono font-bold pointer-events-none fill-slate-200 uppercase tracking-tighter transition-all ${
                    isSelected ? 'fill-white text-[12px] font-black' : ''
                  }`}
                >
                  {gov.code}
                </text>
              </g>
            );
          })}
        </g>

        {/* Active Governorate Stationary Sonar Ripples */}
        {IRAQ_GOVERNORATES_FEATURES.map((gov) => {
          const status = getGovernorateStatus(gov.id);
          if (status !== 'RED' && status !== 'ORANGE') return null;
          const isRed = status === 'RED';
          const pingColor = isRed ? '#f43f5e' : '#f59e0b';

          return (
            <g key={`sonar-${gov.id}`} pointerEvents="none">
              {/* Stationed Expanding Sonar Wave 1 */}
              <circle cx={gov.centroidX} cy={gov.centroidY} r="6" stroke={pingColor} strokeWidth="1.5" fill="none">
                <animate attributeName="r" values="6;28" dur="2.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0" dur="2.2s" repeatCount="indefinite" />
              </circle>

              {/* Stationed Expanding Sonar Wave 2 (Staggered) */}
              <circle cx={gov.centroidX} cy={gov.centroidY} r="6" stroke={pingColor} strokeWidth="1" fill="none">
                <animate attributeName="r" values="6;28" begin="1.1s" dur="2.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0" begin="1.1s" dur="2.2s" repeatCount="indefinite" />
              </circle>
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip Hover Overlay */}
      {hoveredGov && (
        <div
          style={{ left: `${tooltipPos.x + 15}px`, top: `${tooltipPos.y + 15}px` }}
          className="pointer-events-none absolute z-30 min-w-[210px] p-3.5 bg-[#080d1a]/95 border border-slate-700/80 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl font-mono text-xs space-y-2 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
            <span className="font-bold text-white text-sm">
              {hoveredGov.name} ({hoveredGov.nameAr})
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                getGovernorateStatus(hoveredGov.id) === 'RED'
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/40'
                  : getGovernorateStatus(hoveredGov.id) === 'ORANGE'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {getGovernorateStatus(hoveredGov.id)}
            </span>
          </div>

          {hoveredStat ? (
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-300">
                <span>Active Cases:</span>
                <span className="font-bold text-sky-400">{hoveredStat.activeCases}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Total EFU:</span>
                <span className="font-bold text-amber-400">{hoveredStat.totalEFU}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Affected Users:</span>
                <span className="font-bold text-slate-200">{hoveredStat.affectedUsers}</span>
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 font-sans">No active incidents currently</div>
          )}
        </div>
      )}
    </div>
  );
}
