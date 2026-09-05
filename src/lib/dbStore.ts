import { EfuCase, Company, Province, Team, ProvinceStat, CasePriority, User } from '@/types/database';
import { MOCK_CASES, MOCK_COMPANIES, MOCK_PROVINCES, MOCK_TEAMS } from './mockData';
import { getSupabaseAdmin } from './supabase/server';
import { isCaseActive, derivePriority, resolveProvinceId } from './regionMapper';

export interface DBUser extends User {
  phone?: string | null;
  email?: string | null;
  region_id?: string | null;
  telegram_username?: string | null;
  telegram_first_name?: string | null;
  telegram_last_name?: string | null;
  last_login_at?: string | null;
  telegram_linked_at?: string | null;
}

export interface LinkingToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  used: boolean;
}

export interface AuditLogItem {
  id: string;
  user_id: string | null;
  action: string;
  target_type?: string | null;
  target_id?: string | null;
  description: string;
  created_at: string;
}

const DEMO_CASE_IDS = [
  'c-101',
  'c-102',
  'c-103',
  'c-104',
  'c-105',
  'a1111111-1111-1111-1111-111111111111',
  'a2222222-2222-2222-2222-222222222222',
  'a3333333-3333-3333-3333-333333333333',
  'P-26090310473104696',
  'P-26090310223018092',
  'P-26090308151200441',
  'P-26090211050012345',
  'P-26090109150098765',
];

class DatabaseStore {
  private casesList: EfuCase[] = [];
  private companiesList: Company[] = [...MOCK_COMPANIES];
  private provincesList: Province[] = [...MOCK_PROVINCES];
  private teamsList: Team[] = [...MOCK_TEAMS];
  
  // Extended Users list
  private usersList: DBUser[] = [
    {
      id: 'u-dev-1',
      telegram_user_id: 77712345,
      username: 'iraq_efu_admin',
      first_name: 'Developer',
      last_name: 'Admin',
      role: 'ADMIN',
      company_id: 'c1',
      team_id: 't1',
      status: 'ACTIVE',
      photo_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      telegram_linked_at: new Date().toISOString(),
    },
    {
      id: 'u-lead-1',
      telegram_user_id: 88812345,
      username: 'nasria_leader',
      first_name: 'Omar',
      last_name: 'Ali',
      role: 'SUPERVISOR',
      company_id: 'c1',
      team_id: 't1',
      status: 'ACTIVE',
      photo_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      telegram_linked_at: new Date().toISOString(),
    },
    {
      id: 'u-mem-1',
      telegram_user_id: null,
      username: 'ahmed_fns',
      first_name: 'Ahmed',
      last_name: 'Ali',
      role: 'OPERATOR',
      company_id: 'c1',
      team_id: 't1',
      status: 'ACTIVE',
      photo_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  private linkingTokensList: LinkingToken[] = [];
  private botStatesMap: Map<number, { state: string; data: any; updated_at: string }> = new Map();
  private auditLogsList: AuditLogItem[] = [];
  private userPermissionsOverrides: Map<string, Record<string, boolean>> = new Map();

  private isSupabaseConfigured(): boolean {
    const url = process.env.SUPABASE_URL;
    return !!url && !url.includes('demo.supabase.co');
  }

  // 1. GET DASHBOARD DATA
  async getDashboardData() {
    if (this.isSupabaseConfigured()) {
      try {
        const { data: dbCases, error } = await getSupabaseAdmin()
          .from('cases')
          .select('*, company:companies(*), province:provinces(*), assigned_team:teams(*)');

        if (!error && dbCases) {
          this.casesList = (dbCases as EfuCase[]).filter(
            (c) => !DEMO_CASE_IDS.includes(c.id) && !DEMO_CASE_IDS.includes(c.case_id)
          );

          // Older imported cases may have no province_id; recover it from the region
          // so dashboard totals and the map still include those cases.
          this.casesList = this.casesList.map((c) => ({
            ...c,
            province_id: c.province_id || resolveProvinceId(c.region, this.provincesList),
          }));
        }
      } catch (err) {
        console.error('Supabase query fallback to dbStore:', err);
      }
    }

    const nowMs = Date.now();
    const activeCasesList = this.casesList.filter((c) => isCaseActive(c));
    const totalEFU = activeCasesList.reduce((acc, curr) => acc + (curr.efu || 0), 0);
    const affectedUsers = activeCasesList.reduce((acc, curr) => acc + (curr.affected_users || curr.efu || 0), 0);
    const criticalCases = activeCasesList.filter((c) => c.priority === 'CRITICAL' || c.efu >= 200).length;

    const casesOlderThan4Hours = activeCasesList.filter((c) => {
      const createdMs = new Date(c.created_at).getTime();
      return nowMs - createdMs > 4 * 3600 * 1000;
    }).length;

    const provinceStats: ProvinceStat[] = this.provincesList.map((prov) => {
      const provCases = this.casesList.filter((c) => c.province_id === prov.id);
      const provActiveCases = provCases.filter((c) => isCaseActive(c));
      const provEfu = provActiveCases.reduce((a, b) => a + (b.efu || 0), 0);
      const provUsers = provActiveCases.reduce((a, b) => a + (b.affected_users || b.efu || 0), 0);
      const provCritical = provActiveCases.filter((c) => c.priority === 'CRITICAL' || c.efu >= 200).length;
      const highestEFU = provCases.reduce((max, c) => Math.max(max, c.efu || 0), 0);

      const hasCriticalOrOld = provActiveCases.some((c) => {
        const ageHours = (nowMs - new Date(c.created_at).getTime()) / (3600 * 1000);
        return c.efu >= 200 || ageHours >= 4 || c.priority === 'CRITICAL';
      });

      let statusColor: 'RED' | 'ORANGE' | 'CYAN' = 'CYAN';
      if (hasCriticalOrOld || provEfu >= 200 || provCritical > 0) {
        statusColor = 'RED';
      } else if (provActiveCases.length > 0 || provUsers > 0) {
        statusColor = 'ORANGE';
      }

      const sortedByTime = [...provCases].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return {
        provinceId: prov.id,
        provinceCode: prov.code,
        provinceName: prov.name,
        provinceNameAr: prov.name_ar,
        activeCases: provActiveCases.length,
        totalEFU: provEfu,
        affectedUsers: provUsers,
        criticalCases: provCritical,
        highestEFU,
        lastCaseTime: sortedByTime[0]?.created_at || null,
        caseCount: provCases.length,
        statusColor,
      };
    });

    const sortedCases = [...this.casesList].sort((a, b) => {
      const priorityOrder: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      const pA = priorityOrder[a.priority] || 1;
      const pB = priorityOrder[b.priority] || 1;
      if (pB !== pA) return pB - pA;

      const aOverdue = isCaseActive(a) && nowMs - new Date(a.created_at).getTime() >= 4 * 3600 * 1000;
      const bOverdue = isCaseActive(b) && nowMs - new Date(b.created_at).getTime() >= 4 * 3600 * 1000;
      if (aOverdue !== bOverdue) return bOverdue ? 1 : -1;

      // Older cases have waited longer and should be handled first within the same priority.
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    return {
      stats: {
        activeCases: activeCasesList.length,
        totalEFU,
        affectedUsers,
        criticalCases,
        casesOlderThan4Hours,
      },
      cases: sortedCases,
      provinceStats,
    };
  }

  // 2. USER MANAGEMENT API
  getUsers(): DBUser[] {
    return this.usersList;
  }

  async getUserById(id: string): Promise<DBUser | null> {
    return this.usersList.find((u) => u.id === id) || null;
  }

  async getUserByTelegramId(telegramId: number): Promise<DBUser | null> {
    return this.usersList.find((u) => u.telegram_user_id === telegramId) || null;
  }

  async createUser(userData: {
    name: string;
    username?: string;
    email?: string;
    phone?: string;
    role: string;
    team_id?: string;
    region_id?: string;
    status?: string;
  }) {
    const parts = userData.name.trim().split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || '';

    const newUser: DBUser = {
      id: `u-${Date.now()}`,
      telegram_user_id: null,
      username: userData.username || null,
      first_name: firstName,
      last_name: lastName,
      email: userData.email || null,
      phone: userData.phone || null,
      role: userData.role as any,
      company_id: null,
      team_id: userData.team_id || null,
      region_id: userData.region_id || null,
      status: userData.status || 'ACTIVE',
      photo_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.usersList.unshift(newUser);
    await this.logAudit(newUser.id, 'USER_CREATED', 'USER', newUser.id, `Created user ${userData.name} with role ${userData.role}`);
    return newUser;
  }

  async updateUser(id: string, updates: Partial<DBUser>) {
    const idx = this.usersList.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('User not found');

    const updated = { ...this.usersList[idx], ...updates, updated_at: new Date().toISOString() };
    this.usersList[idx] = updated;
    await this.logAudit(id, 'USER_UPDATED', 'USER', id, `Updated user attributes`);
    return updated;
  }

  async toggleUserStatus(id: string, status: 'ACTIVE' | 'DISABLED') {
    const user = await this.updateUser(id, { status });
    await this.logAudit(id, status === 'DISABLED' ? 'USER_DISABLED' : 'USER_ENABLED', 'USER', id, `User status set to ${status}`);
    return user;
  }

  // 3. SECURE SINGLE-USE TELEGRAM LINKING TOKENS
  async generateLinkingToken(userId: string): Promise<string> {
    const token = `link_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 Minutes

    const tokenObj: LinkingToken = {
      id: `t-${Date.now()}`,
      user_id: userId,
      token,
      expires_at: expiresAt,
      used: false,
    };

    this.linkingTokensList.push(tokenObj);
    return token;
  }

  async validateAndLinkTelegram(token: string, tgUser: { id: number; username?: string; first_name?: string; last_name?: string }): Promise<DBUser | null> {
    const foundToken = this.linkingTokensList.find((t) => t.token === token && !t.used);
    if (!foundToken) return null;

    if (new Date(foundToken.expires_at).getTime() < Date.now()) {
      return null;
    }

    // Mark single-use token as used
    foundToken.used = true;

    // Link Telegram identity to internal user
    const targetUser = await this.getUserById(foundToken.user_id);
    if (!targetUser) return null;

    targetUser.telegram_user_id = tgUser.id;
    targetUser.telegram_username = tgUser.username || null;
    targetUser.telegram_first_name = tgUser.first_name || null;
    targetUser.telegram_last_name = tgUser.last_name || null;
    targetUser.telegram_linked_at = new Date().toISOString();
    targetUser.updated_at = new Date().toISOString();

    await this.logAudit(targetUser.id, 'TELEGRAM_LINKED', 'USER', targetUser.id, `Linked Telegram ID ${tgUser.id} to user ${targetUser.first_name}`);
    return targetUser;
  }

  // 4. PERMISSIONS & OVERRIDES
  async getUserPermissionsList(userId: string, role: string): Promise<string[]> {
    const normRole = role === 'ADMIN' ? 'DEVELOPER' : role === 'SUPERVISOR' ? 'LEADER' : role;
    
    // Default role permission matrices
    const defaults: Record<string, string[]> = {
      DEVELOPER: [
        'VIEW_DASHBOARD', 'VIEW_CASES', 'VIEW_CASE_DETAILS', 'VIEW_MAP', 'VIEW_NOTIFICATIONS',
        'CREATE_CASE', 'EDIT_CASE', 'RESOLVE_CASE', 'DELETE_CASE', 'ASSIGN_CASE', 'ADD_CASE_NOTE',
        'VIEW_ALL_CASES', 'VIEW_TEAM_CASES', 'VIEW_REGION_CASES',
        'MANAGE_USERS', 'MANAGE_ROLES', 'MANAGE_PERMISSIONS', 'MANAGE_TEAMS', 'MANAGE_REGIONS',
        'VIEW_STATISTICS', 'VIEW_AUDIT_LOG'
      ],
      LEADER: [
        'VIEW_DASHBOARD', 'VIEW_CASES', 'VIEW_CASE_DETAILS', 'VIEW_MAP', 'VIEW_NOTIFICATIONS',
        'CREATE_CASE', 'EDIT_CASE', 'RESOLVE_CASE', 'DELETE_CASE', 'ASSIGN_CASE', 'ADD_CASE_NOTE',
        'VIEW_TEAM_CASES', 'VIEW_REGION_CASES', 'VIEW_STATISTICS'
      ],
      MEMBER: [
        'VIEW_DASHBOARD', 'VIEW_CASES', 'VIEW_CASE_DETAILS', 'VIEW_MAP', 'VIEW_NOTIFICATIONS',
        'CREATE_CASE', 'ADD_CASE_NOTE', 'VIEW_ARCHIVE', 'RESOLVE_CASE', 'DELETE_CASE'
      ]
    };

    let perms = new Set<string>(defaults[normRole] || defaults['MEMBER']);
    const overrides = this.userPermissionsOverrides.get(userId);

    if (overrides) {
      for (const [key, allowed] of Object.entries(overrides)) {
        if (allowed) perms.add(key);
        else perms.delete(key);
      }
    }

    return Array.from(perms);
  }

  async setUserPermissionOverride(userId: string, permissionKey: string, allowed: boolean) {
    let userOverrides = this.userPermissionsOverrides.get(userId) || {};
    userOverrides[permissionKey] = allowed;
    this.userPermissionsOverrides.set(userId, userOverrides);

    await this.logAudit(userId, allowed ? 'PERMISSION_GRANTED' : 'PERMISSION_REVOKED', 'PERMISSION', permissionKey, `Set permission ${permissionKey} = ${allowed}`);
  }

  // 5. BOT SESSION STATES
  getBotState(telegramId: number) {
    return this.botStatesMap.get(telegramId) || null;
  }

  setBotState(telegramId: number, state: string, data: any = {}) {
    this.botStatesMap.set(telegramId, { state, data, updated_at: new Date().toISOString() });
  }

  clearBotState(telegramId: number) {
    this.botStatesMap.delete(telegramId);
  }

  // 6. AUDIT LOGS
  async logAudit(userId: string | null, action: string, targetType?: string, targetId?: string, description?: string) {
    const item: AuditLogItem = {
      id: `a-${Date.now()}`,
      user_id: userId,
      action,
      target_type: targetType || null,
      target_id: targetId || null,
      description: description || action,
      created_at: new Date().toISOString(),
    };
    this.auditLogsList.unshift(item);
  }

  getAuditLogs(): AuditLogItem[] {
    return this.auditLogsList;
  }

  // Import Case helper
  async upsertImportedCase(input: any) {
    const caseId = input.src.trim();
    const efu = Number(input.efu) || 0;
    const derivedPrio = derivePriority(efu);

    const resolvedProvinceId = resolveProvinceId(input.region, this.provincesList);
    const province = this.provincesList.find((p) => p.id === resolvedProvinceId);
    const maintenance = input.maintenance?.trim() || null;

    const company =
      maintenance && this.companiesList.find(
        (c) =>
          c.name.toLowerCase() === maintenance.toLowerCase() ||
          c.code.toLowerCase() === maintenance.toLowerCase()
      );

    let provinceId = resolvedProvinceId;
    let companyId = company?.id || null;

    if (this.isSupabaseConfigured()) {
      const [{ data: databaseCompanies, error: companiesError }, { data: databaseProvinces, error: provincesError }] =
        await Promise.all([
          getSupabaseAdmin().from('companies').select('id, name, code'),
          getSupabaseAdmin().from('provinces').select('id, name, code'),
        ]);

      if (companiesError) throw new Error(`Failed to load companies: ${companiesError.message}`);
      if (provincesError) throw new Error(`Failed to load provinces: ${provincesError.message}`);

      const databaseCompany = maintenance
        ? (databaseCompanies || []).find(
            (item) => item.name.toLowerCase() === maintenance.toLowerCase() || item.code.toLowerCase() === maintenance.toLowerCase()
          )
        : null;
      const databaseProvince = (databaseProvinces || []).find(
        (item) => item.name.toLowerCase() === (province?.name || '').toLowerCase()
      );

      companyId = databaseCompany?.id || null;
      provinceId = databaseProvince?.id || null;
    }

    const grRequestBool =
      typeof input.gr_request === 'boolean'
        ? input.gr_request
        : (input.gr_request || '').toString().toLowerCase() === 'yes';

    const createdAtISO = input.created_at
      ? (() => {
          const rawCreatedAt = String(input.created_at).trim();
          const normalizedCreatedAt = rawCreatedAt.includes('T')
            ? rawCreatedAt
            : rawCreatedAt.replace(' ', 'T') + '+03:00';
          const parsedCreatedAt = new Date(normalizedCreatedAt);
          if (Number.isNaN(parsedCreatedAt.getTime())) {
            throw new Error('Invalid created_at date');
          }
          return parsedCreatedAt.toISOString();
        })()
      : new Date().toISOString();

    if (this.isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('cases')
        .upsert(
          {
            case_id: caseId,
            fms_url: input.fms_id || null,
            department: input.department || 'Support',
            region: input.region || 'Nasria',
            province_id: provinceId,
            company_id: companyId,
            fdt: input.fdt,
            description: input.description,
            efu,
            affected_users: efu,
            maintenance,
            status: input.status || 'Last Mile',
            escalation: input.escalation || 'Open',
            gr_request: grRequestBool,
            priority: derivedPrio,
            updated_at: new Date().toISOString(),
            created_at: createdAtISO,
          },
          { onConflict: 'case_id' }
        )
        .select('*, company:companies(*), province:provinces(*)')
        .single();

      if (error) throw new Error(`Failed to save case: ${error.message}`);

      this.casesList = this.casesList.filter((c) => c.case_id.toLowerCase() !== caseId.toLowerCase());
      this.casesList.unshift(data as EfuCase);
      return data as EfuCase;
    }

    const existingIndex = this.casesList.findIndex(
      (c) => c.case_id.toLowerCase() === caseId.toLowerCase()
    );

    let caseRecord: EfuCase;

    if (existingIndex !== -1) {
      caseRecord = {
        ...this.casesList[existingIndex],
        fms_url: input.fms_id || this.casesList[existingIndex].fms_url,
        department: input.department || this.casesList[existingIndex].department,
        region: input.region || this.casesList[existingIndex].region,
        province_id: provinceId,
        fdt: input.fdt || this.casesList[existingIndex].fdt,
        description: input.description || this.casesList[existingIndex].description,
        efu,
        affected_users: efu,
        maintenance,
        status: input.status || this.casesList[existingIndex].status,
        escalation: input.escalation || this.casesList[existingIndex].escalation,
        gr_request: grRequestBool,
        priority: derivedPrio,
        updated_at: new Date().toISOString(),
        company,
        province,
      };

      this.casesList[existingIndex] = caseRecord;
    } else {
      const now = new Date().toISOString();
      caseRecord = {
        id: `c-${Date.now()}`,
        case_id: caseId,
        fms_url: input.fms_id || null,
        department: input.department || 'Support',
        region: input.region || 'Nasria',
        province_id: provinceId,
        company_id: company?.id || null,
        fdt: input.fdt,
        description: input.description,
        efu,
        affected_users: efu,
        maintenance,
        status: input.status || 'Last Mile',
        escalation: input.escalation || 'Open',
        gr_request: grRequestBool,
        priority: derivedPrio,
        assigned_team_id: null,
        created_at: createdAtISO,
        updated_at: now,
        company,
        province,
      };

      this.casesList.unshift(caseRecord);
    }

    return caseRecord;
  }

  // Basic Case Mutations
  async updateCaseStatus(caseId: string, status?: string, teamId?: string, escalation?: string) {
    if (this.isSupabaseConfigured()) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(caseId);
      const updateData: Record<string, string | null> = {};
      if (status) updateData.status = status;
      if (escalation) updateData.escalation = escalation;
      if (teamId !== undefined) updateData.assigned_team_id = teamId || null;

      const isClosed = ['CLOSED', 'RESOLVED'].includes((status || '').toUpperCase()) || escalation?.toUpperCase() === 'CLOSED';
      const isOpen = escalation?.toUpperCase() === 'OPEN' && !isClosed;
      if (isClosed) {
        updateData.closed_at = new Date().toISOString();
        updateData.archived_at = new Date().toISOString();
      } else if (isOpen) {
        updateData.closed_at = null;
        updateData.archived_at = null;
        updateData.closed_by = null;
        updateData.archived_by = null;
      }
      updateData.updated_at = new Date().toISOString();

      const query = getSupabaseAdmin().from('cases').update(updateData);
      const { data, error } = await (isUuid ? query.eq('id', caseId) : query.eq('case_id', caseId))
        .select('*, company:companies(*), province:provinces(*), assigned_team:teams(*)')
        .single();

      if (error) throw new Error(`Failed to update case: ${error.message}`);
      this.casesList = this.casesList.filter((c) => c.id !== data.id && c.case_id !== data.case_id);
      this.casesList.unshift(data as EfuCase);
      return data as EfuCase;
    }

    const idx = this.casesList.findIndex((c) => c.id === caseId || c.case_id === caseId);
    if (idx === -1) throw new Error('Case not found');

    const updated = { ...this.casesList[idx] };
    if (status) updated.status = status;
    if (escalation) updated.escalation = escalation;
    if (teamId !== undefined) {
      updated.assigned_team_id = teamId;
      updated.assigned_team = this.teamsList.find((t) => t.id === teamId);
    }
    updated.updated_at = new Date().toISOString();
    this.casesList[idx] = updated;
    return updated;
  }

  async addCaseNote(caseId: string, noteText: string, userId?: string) {
    const target = this.casesList.find((c) => c.id === caseId || c.case_id === caseId);
    if (!target) throw new Error('Case not found');

    return {
      id: `n-${Date.now()}`,
      case_id: target.id,
      user_id: userId || null,
      note: noteText,
      created_at: new Date().toISOString(),
    };
  }

  async deleteCase(caseId: string) {
    if (this.isSupabaseConfigured()) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(caseId);
      const query = getSupabaseAdmin().from('cases').delete();
      const { data, error } = await (isUuid ? query.eq('id', caseId) : query.eq('case_id', caseId))
        .select()
        .single();

      if (error) throw new Error(`Failed to delete case: ${error.message}`);
      this.casesList = this.casesList.filter((c) => c.id !== data.id && c.case_id !== data.case_id);
      return data as EfuCase;
    }

    const idx = this.casesList.findIndex((c) => c.id === caseId || c.case_id === caseId);
    if (idx === -1) throw new Error('Case not found');
    return this.casesList.splice(idx, 1)[0];
  }

  async createCase(caseData: any) {
    return this.upsertImportedCase({
      src: caseData.case_id,
      efu: caseData.efu,
      department: caseData.department || 'Support',
      region: caseData.region || 'Nasria',
      fdt: caseData.fdt,
      description: caseData.description,
      maintenance: caseData.maintenance || null,
      status: caseData.status || 'Last Mile',
      escalation: caseData.escalation || 'Open',
    });
  }

  getCompanies() { return this.companiesList; }
  getProvinces() { return this.provincesList; }
  getTeams() { return this.teamsList; }
}

export const dbStore = new DatabaseStore();

