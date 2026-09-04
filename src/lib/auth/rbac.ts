export type SystemRole = 'DEVELOPER' | 'LEADER' | 'MEMBER' | 'ADMIN' | 'OPERATOR';

export interface InternalUserPermissions {
  role: SystemRole;
  canViewDashboard: boolean;
  canViewCases: boolean;
  canCreateCase: boolean;
  canEditCase: boolean;
  canResolveCase: boolean;
  canManageUsers: boolean;
  canViewNotifications: boolean;
  canViewProfile: boolean;
}

/**
 * Standardize role strings to core SystemRole (DEVELOPER, LEADER, MEMBER).
 */
export function normalizeRole(roleString?: string | null): 'DEVELOPER' | 'LEADER' | 'MEMBER' {
  if (!roleString) return 'MEMBER';
  const r = roleString.trim().toUpperCase();
  if (r === 'DEVELOPER' || r === 'ADMIN') return 'DEVELOPER';
  if (r === 'LEADER' || r === 'MANAGER' || r === 'SUPERVISOR') return 'LEADER';
  return 'MEMBER';
}

/**
 * Check if user role can view the Profile section.
 * Only DEVELOPER / ADMIN roles can access technical profile data.
 */
export function canViewProfile(role?: string | null): boolean {
  return normalizeRole(role) === 'DEVELOPER';
}

/**
 * Check if user role can manage users and system settings.
 */
export function canManageUsers(role?: string | null): boolean {
  return normalizeRole(role) === 'DEVELOPER';
}

/**
 * Check if user role can view the Task Archive section.
 * Accessible to all operations agents and users.
 */
export function canViewArchive(role?: string | null): boolean {
  return true;
}

/**
 * Check if user role can create a new EFU case.
 */
export function canCreateCase(role?: string | null): boolean {
  const norm = normalizeRole(role);
  return norm === 'DEVELOPER' || norm === 'LEADER' || norm === 'MEMBER';
}

/**
 * Check if user role can edit/resolve EFU cases.
 */
export function canResolveCase(role?: string | null): boolean {
  const norm = normalizeRole(role);
  return norm === 'DEVELOPER' || norm === 'LEADER' || norm === 'MEMBER';
}

/**
 * Get complete permissions object for a given role.
 */
export function getUserPermissions(role?: string | null): InternalUserPermissions {
  const norm = normalizeRole(role);

  return {
    role: norm,
    canViewDashboard: true,
    canViewCases: true,
    canCreateCase: true, // MEMBER, LEADER, DEVELOPER
    canEditCase: norm === 'DEVELOPER' || norm === 'LEADER',
    canResolveCase: true,
    canManageUsers: norm === 'DEVELOPER',
    canViewNotifications: true,
    canViewProfile: norm === 'DEVELOPER', // ONLY DEVELOPER
  };
}

/**
 * Data Minimization Helper:
 * Sanitizes user record for client UI (removes raw telegram_id, internal database UUIDs, session keys).
 */
export function sanitizeUserForClient(user: any) {
  if (!user) return null;

  return {
    display_name: user.first_name
      ? `${user.first_name} ${user.last_name || ''}`.trim()
      : user.username
      ? `@${user.username}`
      : 'Operations Agent',
    role: normalizeRole(user.role),
    photo_url: user.photo_url || null,
  };
}
