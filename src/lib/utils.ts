import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculates human readable case age from creation date ISO string
 */
export function getCaseAge(createdAt: string): string {
  const created = new Date(createdAt).getTime();
  const now = new Date().getTime();
  const diffMs = Math.max(0, now - created);
  
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
}

/**
 * Calculates age in hours for filter comparisons
 */
export function getCaseAgeHours(createdAt: string): number {
  const created = new Date(createdAt).getTime();
  const now = new Date().getTime();
  return (now - created) / (1000 * 60 * 60);
}

/**
 * Format ISO string to readable date: 03 Sep 2026
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Format ISO string to readable time: 13:30
 */
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Formats EFU badge color scheme based on EFU count and priority
 */
export function getEfuStatusStyle(efu: number, priority: string, status: string) {
  if (status === 'RESOLVED' || status === 'CLOSED') {
    return {
      bg: 'bg-emerald-950/60',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/20'
    };
  }
  
  if (efu > 200 || priority === 'CRITICAL') {
    return {
      bg: 'bg-red-950/60',
      border: 'border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]',
      text: 'text-red-400',
      badgeBg: 'bg-red-500/20'
    };
  }

  if (efu > 20 || priority === 'HIGH') {
    return {
      bg: 'bg-amber-950/60',
      border: 'border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
      text: 'text-amber-400',
      badgeBg: 'bg-amber-500/20'
    };
  }

  return {
    bg: 'bg-cyan-950/60',
    border: 'border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]',
    text: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/20'
  };
}
