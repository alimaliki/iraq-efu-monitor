import { Company, Province, EfuCase, Team } from '@/types/database';

export const MOCK_COMPANIES: Company[] = [
  { id: 'c1', name: 'WNS', code: 'WNS', status: 'ACTIVE', created_at: new Date().toISOString() },
  { id: 'c2', name: 'Zain Iraq', code: 'ZAIN', status: 'ACTIVE', created_at: new Date().toISOString() },
  { id: 'c3', name: 'AsiaCell', code: 'ASIACELL', status: 'ACTIVE', created_at: new Date().toISOString() },
  { id: 'c4', name: 'Korek Telecom', code: 'KOREK', status: 'ACTIVE', created_at: new Date().toISOString() },
];

export const MOCK_PROVINCES: Province[] = [
  { id: 'p1', name: 'Baghdad', name_ar: 'Baghdad', code: 'BG', latitude: 33.3152, longitude: 44.3661, created_at: new Date().toISOString() },
  { id: 'p2', name: 'Basra', name_ar: 'Basra', code: 'BS', latitude: 30.5081, longitude: 47.7835, created_at: new Date().toISOString() },
  { id: 'p3', name: 'Dhi Qar', name_ar: 'Dhi Qar', code: 'DQ', latitude: 31.0580, longitude: 46.2573, created_at: new Date().toISOString() },
  { id: 'p4', name: 'Maysan', name_ar: 'Maysan', code: 'MY', latitude: 31.8360, longitude: 47.1444, created_at: new Date().toISOString() },
  { id: 'p5', name: 'Muthanna', name_ar: 'Muthanna', code: 'MU', latitude: 30.3000, longitude: 45.3000, created_at: new Date().toISOString() },
  { id: 'p6', name: 'Najaf', name_ar: 'Najaf', code: 'NJ', latitude: 32.0000, longitude: 44.3333, created_at: new Date().toISOString() },
  { id: 'p7', name: 'Karbala', name_ar: 'Karbala', code: 'KR', latitude: 32.6160, longitude: 44.0250, created_at: new Date().toISOString() },
  { id: 'p8', name: 'Babil', name_ar: 'Babil', code: 'BB', latitude: 32.4682, longitude: 44.4253, created_at: new Date().toISOString() },
  { id: 'p9', name: 'Wasit', name_ar: 'Wasit', code: 'WS', latitude: 32.5000, longitude: 45.8333, created_at: new Date().toISOString() },
  { id: 'p10', name: 'Qadisiyah', name_ar: 'Qadisiyah', code: 'QA', latitude: 31.9856, longitude: 44.9261, created_at: new Date().toISOString() },
  { id: 'p11', name: 'Anbar', name_ar: 'Anbar', code: 'AN', latitude: 33.4200, longitude: 43.3000, created_at: new Date().toISOString() },
  { id: 'p12', name: 'Salah al-Din', name_ar: 'Salah al-Din', code: 'SD', latitude: 34.6000, longitude: 43.6800, created_at: new Date().toISOString() },
  { id: 'p13', name: 'Kirkuk', name_ar: 'Kirkuk', code: 'KI', latitude: 35.4681, longitude: 44.3922, created_at: new Date().toISOString() },
  { id: 'p14', name: 'Diyala', name_ar: 'Diyala', code: 'DY', latitude: 33.7500, longitude: 45.1500, created_at: new Date().toISOString() },
  { id: 'p15', name: 'Nineveh', name_ar: 'Nineveh', code: 'NI', latitude: 36.3350, longitude: 43.1189, created_at: new Date().toISOString() },
  { id: 'p16', name: 'Erbil', name_ar: 'Erbil', code: 'ER', latitude: 36.1901, longitude: 44.0091, created_at: new Date().toISOString() },
  { id: 'p17', name: 'Duhok', name_ar: 'Duhok', code: 'DH', latitude: 36.8679, longitude: 42.9880, created_at: new Date().toISOString() },
  { id: 'p18', name: 'Sulaymaniyah', name_ar: 'Sulaymaniyah', code: 'SU', latitude: 35.5500, longitude: 45.4333, created_at: new Date().toISOString() },
];

export const MOCK_TEAMS: Team[] = [
  { id: 't1', name: 'Nasria Rapid Response Team', code: 'TEAM-DQ-01', leader_id: null, province_id: 'p3', status: 'ACTIVE', created_at: new Date().toISOString() },
  { id: 't2', name: 'Baghdad Central Fiber Ops', code: 'TEAM-BG-01', leader_id: null, province_id: 'p1', status: 'ACTIVE', created_at: new Date().toISOString() },
  { id: 't3', name: 'Basra Port Operations', code: 'TEAM-BS-01', leader_id: null, province_id: 'p2', status: 'ACTIVE', created_at: new Date().toISOString() },
  { id: 't4', name: 'Erbil Northern Network Control', code: 'TEAM-ER-01', leader_id: null, province_id: 'p16', status: 'ACTIVE', created_at: new Date().toISOString() },
];

export const MOCK_CASES: EfuCase[] = [];

