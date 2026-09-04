/**
 * 4-Hour SLA & Case Timer Calculation Module.
 * The incoming created_at timestamp is the authoritative start time.
 */

export interface SLAData {
  createdMs: number;
  deadlineMs: number;
  elapsedMs: number;
  remainingMs: number;
  overdueMs: number;
  isOverdue: boolean;
  elapsedFormatted: string;
  remainingFormatted: string;
  overdueFormatted: string;
  progressPct: number; // 0% to 100% of 4 hours
  slaThreatLevel: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OVERDUE';
  deadlineISO: string;
}

export interface ClosedSLAData {
  createdISO: string;
  closedISO: string;
  durationMs: number;
  durationFormatted: string; // e.g. "2h 48m" or "02:48:15"
  slaBreached: boolean;
  statusBadge: 'SLA COMPLIANT' | 'SLA BREACHED';
}

/**
 * Format milliseconds into HH:MM:SS string
 */
export function formatDurationHHMMSS(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Format milliseconds into human readable duration e.g. "2h 48m"
 */
export function formatDurationHuman(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / (60 * 1000)));
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

/**
 * Compute exact SLA & Timer metrics relative to current time or closure time.
 */
export function getSLAData(
  createdAtISO: string,
  currentMsInput?: number,
  closedAtISO?: string | null
): SLAData {
  // Parse created_at safely
  const createdMs = new Date(createdAtISO).getTime() || Date.now();
  const fourHoursMs = 4 * 3600 * 1000;
  const deadlineMs = createdMs + fourHoursMs;

  // If task is closed/resolved, freeze calculation at closure time
  const currentMs = closedAtISO
    ? new Date(closedAtISO).getTime()
    : currentMsInput || Date.now();

  const elapsedMs = Math.max(0, currentMs - createdMs);
  const isOverdue = currentMs >= deadlineMs;
  const remainingMs = isOverdue ? 0 : Math.max(0, deadlineMs - currentMs);
  const overdueMs = isOverdue ? Math.max(0, currentMs - deadlineMs) : 0;

  // Progress percentage (capped between 0 and 100%)
  const progressPct = Math.min(100, Math.max(0, (elapsedMs / fourHoursMs) * 100));

  // Determine SLA Threat Level
  const elapsedHours = elapsedMs / (3600 * 1000);
  let slaThreatLevel: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OVERDUE' = 'NORMAL';

  if (isOverdue) {
    slaThreatLevel = 'OVERDUE';
  } else if (elapsedHours >= 3) {
    slaThreatLevel = 'CRITICAL';
  } else if (elapsedHours >= 2) {
    slaThreatLevel = 'WARNING';
  }

  return {
    createdMs,
    deadlineMs,
    elapsedMs,
    remainingMs,
    overdueMs,
    isOverdue,
    elapsedFormatted: formatDurationHHMMSS(elapsedMs),
    remainingFormatted: formatDurationHHMMSS(remainingMs),
    overdueFormatted: formatDurationHHMMSS(overdueMs),
    progressPct,
    slaThreatLevel,
    deadlineISO: new Date(deadlineMs).toISOString(),
  };
}

/**
 * Calculate historical SLA metrics for Closed/Archived tasks.
 */
export function getClosedSLAData(createdAtISO: string, closedAtISO?: string | null): ClosedSLAData {
  const createdMs = new Date(createdAtISO).getTime();
  const closedMs = closedAtISO ? new Date(closedAtISO).getTime() : Date.now();
  const durationMs = Math.max(0, closedMs - createdMs);

  const fourHoursMs = 4 * 3600 * 1000;
  const slaBreached = durationMs > fourHoursMs;

  return {
    createdISO: createdAtISO,
    closedISO: new Date(closedMs).toISOString(),
    durationMs,
    durationFormatted: formatDurationHuman(durationMs),
    slaBreached,
    statusBadge: slaBreached ? 'SLA BREACHED' : 'SLA COMPLIANT',
  };
}
