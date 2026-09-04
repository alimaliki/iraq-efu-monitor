import { EfuCase, Province, CasePriority } from '@/types/database';

/**
 * Centralized Active Case Business Logic.
 * A case is considered ACTIVE when escalation is "OPEN" (case-insensitive).
 */
export function isCaseActive(c: EfuCase | { escalation?: string; status?: string }): boolean {
  if (!c) return false;
  const status = (c.status || '').toUpperCase();
  if (status === 'CLOSED' || status === 'RESOLVED' || status === 'ARCHIVED') {
    return false;
  }
  if (c.escalation) {
    return c.escalation.trim().toUpperCase() === 'OPEN';
  }
  return true;
}

/**
 * Centralized Derived Priority calculation based on EFU count.
 */
export function derivePriority(efu: number): CasePriority {
  const count = Number(efu) || 0;
  if (count >= 200) return 'CRITICAL';
  if (count >= 100) return 'HIGH';
  if (count >= 50) return 'MEDIUM';
  return 'LOW';
}

/**
 * Dynamic Region-to-Governorate Resolution.
 * Maps region names like "Nasria" => Dhi Qar, "Amara" => Maysan, "Ramadi" => Anbar, etc.
 */
export function resolveProvinceId(region: string | null | undefined, provinces: Province[]): string | null {
  if (!region || !region.trim()) {
    // Default to Baghdad if empty
    return provinces.find((p) => p.code === 'BG')?.id || provinces[0]?.id || null;
  }

  const r = region.trim().toLowerCase();

  // Region aliases table (quoted keys for valid JS identifiers)
  const aliasMap: Record<string, string> = {
    'nasria': 'dhi qar',
    'nasiriya': 'dhi qar',
    'thi-qar': 'dhi qar',
    'thi qar': 'dhi qar',
    'amara': 'maysan',
    'al-amara': 'maysan',
    'samawa': 'muthanna',
    'al-samawa': 'muthanna',
    'hilla': 'babil',
    'al-hilla': 'babil',
    'kut': 'wasit',
    'al-kut': 'wasit',
    'diwaniya': 'qadisiyah',
    'diwaniyah': 'qadisiyah',
    'ramadi': 'anbar',
    'fallujah': 'anbar',
    'tikrit': 'salah al-din',
    'samarra': 'salah al-din',
    'salahaddin': 'salah al-din',
    'baqubah': 'diyala',
    'mosul': 'nineveh',
    'ninawa': 'nineveh',
    'hawler': 'erbil',
    'arbil': 'erbil',
    'slemani': 'sulaymaniyah',
    'sulaimaniyah': 'sulaymaniyah',
    'dhok': 'duhok',
    'dahuk': 'duhok',
    'karkh': 'baghdad',
    'rusafa': 'baghdad',
  };

  const targetName = aliasMap[r] || r;

  const found = provinces.find(
    (p) =>
      p.name.toLowerCase() === targetName ||
      p.name_ar.toLowerCase() === targetName ||
      p.code.toLowerCase() === targetName
  );

  if (found) return found.id;

  // Partial match fallback
  const partial = provinces.find((p) => p.name.toLowerCase().includes(targetName) || targetName.includes(p.name.toLowerCase()));
  return partial ? partial.id : provinces[0]?.id || null;
}
