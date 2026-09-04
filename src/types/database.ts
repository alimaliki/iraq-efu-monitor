export type UserRole = 'ADMIN' | 'MANAGER' | 'SUPERVISOR' | 'OPERATOR' | 'VIEWER';
export type CasePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CaseStatus = string;
export type NotificationType = 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';

export interface Company {
  id: string;
  name: string;
  code: string;
  status: string;
  created_at: string;
}

export interface Province {
  id: string;
  name: string;
  name_ar: string;
  code: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface RegionMapping {
  id: string;
  region_name: string;
  province_id: string;
  created_at: string;
}

export interface User {
  id: string;
  telegram_user_id: number | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  company_id: string | null;
  team_id: string | null;
  status: string;
  photo_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  leader_id: string | null;
  province_id: string | null;
  status: string;
  created_at: string;
}

export interface EfuCase {
  id: string;
  case_id: string; // SRC
  fms_url?: string | null; // FMS ID URL
  department?: string | null; // Department (e.g. Support)
  region?: string | null; // Region (e.g. Nasria)
  province_id: string | null;
  company_id?: string | null;
  fdt: string; // FDT
  description: string; // Description
  efu: number; // EFU
  affected_users: number; // Affected users
  maintenance?: string | null; // Maintenance (e.g. WNS)
  status: string; // Status (e.g. Last Mile)
  escalation: string; // Escalation (Open / Closed)
  gr_request: boolean; // GR Request (true/false => Yes/No)
  priority: CasePriority; // Derived Priority (LOW, MEDIUM, HIGH, CRITICAL)
  assigned_team_id: string | null;
  created_at: string;
  acknowledged_at?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  closed_by?: string | null;
  archived_at?: string | null;
  archived_by?: string | null;
  updated_at: string;
  // Joined relation fields for UI rendering
  company?: Company;
  province?: Province;
  assigned_team?: Team;
}

export interface CaseEvent {
  id: string;
  case_id: string;
  event_type: string;
  description: string;
  created_by: string | null;
  created_at: string;
  user?: User;
}

export interface CaseNote {
  id: string;
  case_id: string;
  user_id: string | null;
  note: string;
  created_at: string;
  user?: User;
}

export interface SystemNotification {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  created_at: string;
}

export interface ProvinceStat {
  provinceId: string;
  provinceName: string;
  provinceNameAr: string;
  activeCases: number;
  totalEFU: number;
  affectedUsers: number;
  criticalCases: number;
  highestEFU: number;
  lastCaseTime: string | null;
  caseCount: number;
  statusColor: 'RED' | 'ORANGE' | 'CYAN';
}

export interface DashboardStats {
  totalCases: number;
  activeCases: number;
  totalEFU: number;
  affectedUsers: number;
  criticalCases: number;
  casesOlderThan4Hours: number;
}

export interface FilterOptions {
  maintenance: string;
  region: string;
  department: string;
  provinceId: string;
  caseAge: 'ALL' | '<1H' | '1-2H' | '2-4H' | '>4H' | '>8H' | '>24H';
  status: string;
  escalation: string;
  grRequest: 'ALL' | 'YES' | 'NO';
  searchQuery: string;
}
