'use client';

import React, { useState, useEffect } from 'react';
import { X, PlusCircle, AlertCircle, ShieldAlert, FileText, Sparkles, Clipboard, Trash2 } from 'lucide-react';
import { Company, Province, Team } from '@/types/database';

interface NewCaseModalProps {
  companies: Company[];
  provinces: Province[];
  teams: Team[];
  isOpen: boolean;
  onClose: () => void;
  onSubmitCase: (caseData: any) => Promise<{ success: boolean; error?: string }>;
}

export default function NewCaseModal({
  companies,
  provinces,
  teams,
  isOpen,
  onClose,
  onSubmitCase,
}: NewCaseModalProps) {
  const [activeInputMode, setActiveInputMode] = useState<'RAW_PASTE' | 'FORM'>('RAW_PASTE');

  // Raw Text Paste State (Starts completely empty for direct pasting)
  const [rawText, setRawText] = useState('');

  // Form Fields State (Empty defaults)
  const [src, setSrc] = useState('');
  const [fmsUrl, setFmsUrl] = useState('');
  const [department, setDepartment] = useState('Support');
  const [region, setRegion] = useState('');
  const [fdt, setFdt] = useState('');
  const [description, setDescription] = useState('');
  const [efu, setEfu] = useState<number>(0);
  const [maintenance, setMaintenance] = useState('');
  const [status, setStatus] = useState('Last Mile');
  const [escalation, setEscalation] = useState('Open');
  const [grRequest, setGrRequest] = useState<boolean>(false);
  const [createdAt, setCreatedAt] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset fields whenever modal opens so it's clean and ready for direct paste
  useEffect(() => {
    if (isOpen) {
      setRawText('');
      setSrc('');
      setFmsUrl('');
      setDepartment('Support');
      setRegion('');
      setFdt('');
      setDescription('');
      setEfu(0);
      setMaintenance('');
      setStatus('Last Mile');
      setEscalation('Open');
      setGrRequest(false);
      setCreatedAt(new Date().toISOString().replace('T', ' ').substring(0, 19));
      setFormError(null);
    }
  }, [isOpen]);

  const handlePasteClipboard = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setRawText(text);
          setFormError(null);
        }
      }
    } catch (err) {
      console.warn('Clipboard read access:', err);
    }
  };

  const handleLoadSample = () => {
    setRawText(`SRC: P-26090310473104696
FMS ID: https://msp.go2field.iq/task/6a1934d7-f188-4517-bcc1-20a81530e610
Department: Support
Region: Nasria
FDT: FNS0211
Description: FNS0211 Fat 29 down
EFU: 3
Maintenance: WNS
Status: Last Mile
Escalation: Open
GR Request: No
Created At: 2026-09-03 13:53:13`);
  };

  if (!isOpen) return null;

  // Helper to parse key: value raw text lines
  const parseRawText = (text: string) => {
    const lines = text.split('\n');
    const parsed: Record<string, string> = {};

    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        const key = line.slice(0, colonIdx).trim().toLowerCase();
        const value = line.slice(colonIdx + 1).trim();
        parsed[key] = value;
      }
    }

    const normalizeCaseId = (value: string) => value.replace(/^#\s*/, '').trim();
    const standaloneCaseId = lines
      .map((line) => line.trim())
      .map((line) => line.match(/^#?\s*((?:P-|SRE|CC-)[A-Z0-9-]+)\s*$/i)?.[1] || '')
      .find(Boolean);

    return {
      src: normalizeCaseId(
        parsed['src'] ||
          parsed['case id'] ||
          parsed['case_id'] ||
          parsed['sre'] ||
          parsed['sre id'] ||
          parsed['cc'] ||
          parsed['cc id'] ||
          standaloneCaseId ||
          ''
      ),
      fms_id: parsed['fms id'] || parsed['fms_id'] || parsed['fms url'] || '',
      department: parsed['department'] || 'Support',
      region: parsed['region'] || 'Nasria',
      fdt: parsed['fdt'] || '',
      description: parsed['description'] || '',
      efu: Number(parsed['efu']) || 0,
      maintenance: parsed['maintenance'] || '',
      status: parsed['status'] || 'Last Mile',
      escalation: parsed['escalation'] || 'Open',
      gr_request: (parsed['gr request'] || parsed['gr_request'] || '').toLowerCase() === 'yes',
      created_at: parsed['created at'] || parsed['created_at'] || new Date().toISOString(),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    let payload: any;

    if (activeInputMode === 'RAW_PASTE') {
      if (!rawText.trim()) {
        setFormError('Please paste the incoming task text');
        return;
      }
      payload = parseRawText(rawText);
      if (!payload.src) {
        setFormError('Could not parse "SRC:" identifier from raw text');
        return;
      }
      if (!payload.fdt) {
        setFormError('Could not parse "FDT:" identifier from raw text');
        return;
      }
    } else {
      if (!src.trim()) {
        setFormError('SRC / Case ID is required');
        return;
      }
      if (!fdt.trim()) {
        setFormError('FDT code is required');
        return;
      }
      if (!description.trim()) {
        setFormError('Description is required');
        return;
      }

      payload = {
        src: src.trim(),
        fms_id: fmsUrl.trim(),
        department,
        region,
        fdt: fdt.trim(),
        description: description.trim(),
        efu: Number(efu) || 0,
        maintenance,
        status,
        escalation,
        gr_request: grRequest,
        created_at: createdAt,
      };
    }

    setIsSubmitting(true);

    try {
      let result: { success: boolean; error?: string };

      if (onSubmitCase) {
        result = await onSubmitCase(payload);
      } else {
        const res = await fetch('/api/cases/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        result = await res.json();
      }

      setIsSubmitting(false);

      if (result.success) {
        setRawText('');
        onClose();
      } else {
        setFormError(result.error || 'Failed to import task');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setFormError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-mono animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0a101f] border border-slate-700/80 rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0d1424] border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wider">
                IMPORT INCOMING TASK DATA
              </h2>
              <p className="text-[10px] text-slate-400 font-sans">Add a new case and save it with live synchronization</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-[#0a101f] border-b border-slate-800/80 px-6 pt-3 gap-3 text-xs">
          <button
            onClick={() => setActiveInputMode('RAW_PASTE')}
            className={`px-3.5 py-2 rounded-t-xl font-bold flex items-center gap-1.5 transition-all ${
              activeInputMode === 'RAW_PASTE'
                ? 'bg-[#0d1424] text-sky-300 border-t border-x border-slate-700/70'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> PASTE RAW TASK TEXT
          </button>
          <button
            onClick={() => setActiveInputMode('FORM')}
            className={`px-3.5 py-2 rounded-t-xl font-bold flex items-center gap-1.5 transition-all ${
              activeInputMode === 'FORM'
                ? 'bg-[#0d1424] text-sky-300 border-t border-x border-slate-700/70'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" /> MANUAL FORM FIELDS
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {formError && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {activeInputMode === 'RAW_PASTE' ? (
            <div className="space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-slate-300 font-bold block">
                  PASTE INCOMING TASK PAYLOAD (KEY: VALUE FORMAT)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="px-3 py-1 bg-sky-500/10 border border-sky-500/30 hover:bg-sky-500 hover:text-white text-sky-300 font-bold rounded-lg text-[11px] flex items-center gap-1 transition-all"
                    title="Paste from clipboard"
                  >
                    <Clipboard className="w-3.5 h-3.5" /> PASTE CLIPBOARD
                  </button>
                  {rawText && (
                    <button
                      type="button"
                      onClick={() => setRawText('')}
                      className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500 hover:text-white text-rose-300 font-bold rounded-lg text-[11px] flex items-center gap-1 transition-all"
                      title="Clear text"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> CLEAR
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold transition-all"
                    title="Load example format"
                  >
                    EXAMPLE
                  </button>
                </div>
              </div>
              <textarea
                rows={12}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                autoFocus
                placeholder={`Paste your task payload directly here without deleting anything:\n\nSRC: P-26090310473104696\nFMS ID: https://msp.go2field.iq/task/...\nDepartment: Support\nRegion: Nasria\nFDT: FNS0211\nDescription: Fiber cut or GPON fault\nEFU: 12\nMaintenance: WNS\nStatus: Last Mile\nEscalation: Open\nGR Request: No\nCreated At: 2026-09-03 13:53:13`}
                className="w-full p-3 bg-[#080d1a] border border-slate-700/60 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-sky-500 leading-relaxed shadow-inner placeholder-slate-500"
                required
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* SRC */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">SRC (CASE ID) *</label>
                <input
                  type="text"
                  value={src}
                  onChange={(e) => setSrc(e.target.value)}
                  placeholder="P-26090310473104696"
                  className="w-full px-3 py-2 bg-[#080d1a] border border-slate-700/60 rounded-xl text-slate-100 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              {/* FMS ID URL */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">FMS ID URL</label>
                <input
                  type="text"
                  value={fmsUrl}
                  onChange={(e) => setFmsUrl(e.target.value)}
                  placeholder="https://msp.go2field.iq/task/..."
                  className="w-full px-3 py-2 bg-[#080d1a] border border-slate-700/60 rounded-xl text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Department */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">DEPARTMENT</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Support"
                  className="w-full px-3 py-2 bg-[#080d1a] border border-slate-700/60 rounded-xl text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Region */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">REGION *</label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="Nasria"
                  className="w-full px-3 py-2 bg-[#080d1a] border border-slate-700/60 rounded-xl text-slate-100 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              {/* FDT */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">FDT *</label>
                <input
                  type="text"
                  value={fdt}
                  onChange={(e) => setFdt(e.target.value)}
                  placeholder="FNS0211"
                  className="w-full px-3 py-2 bg-[#080d1a] border border-slate-700/60 rounded-xl text-slate-100 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              {/* EFU */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">EFU *</label>
                <input
                  type="number"
                  min="0"
                  value={efu}
                  onChange={(e) => setEfu(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-[#080d1a] border border-slate-700/60 rounded-xl text-amber-400 font-bold focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              {/* Maintenance */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">MAINTENANCE</label>
                <input
                  type="text"
                  value={maintenance}
                  onChange={(e) => setMaintenance(e.target.value)}
                  placeholder="Company / operator (optional)"
                  className="w-full px-3 py-2 bg-[#080d1a] border border-slate-700/60 rounded-xl text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Status */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">TASK STATUS</label>
                <input
                  type="text"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  placeholder="Last Mile"
                  className="w-full px-3 py-2 bg-[#080d1a] border border-slate-700/60 rounded-xl text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Escalation */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">ESCALATION</label>
                <select
                  value={escalation}
                  onChange={(e) => setEscalation(e.target.value)}
                  className="w-full px-3 py-2 bg-[#080d1a] border border-slate-700/60 rounded-xl text-slate-100 focus:outline-none focus:border-sky-500"
                >
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              {/* GR Request */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">GR REQUEST</label>
                <select
                  value={grRequest ? 'Yes' : 'No'}
                  onChange={(e) => setGrRequest(e.target.value === 'Yes')}
                  className="w-full px-3 py-2 bg-[#080d1a] border border-slate-700/60 rounded-xl text-slate-100 focus:outline-none focus:border-sky-500"
                >
                  <option value="No">No (false)</option>
                  <option value="Yes">Yes (true)</option>
                </select>
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="text-slate-300 font-bold block mb-1">DESCRIPTION *</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="FNS0211 Fat 29 down"
                  className="w-full px-3 py-2 bg-[#080d1a] border border-slate-700/60 rounded-xl text-slate-100 focus:outline-none focus:border-sky-500 font-sans"
                  required
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(56,189,248,0.3)] disabled:opacity-50"
            >
              <ShieldAlert className="w-4 h-4" /> {isSubmitting ? 'IMPORTING...' : 'IMPORT TASK'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
