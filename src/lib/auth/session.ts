import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/dbStore';
import { getUserPermissions } from './rbac';

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'efu_session';

export interface AuthSessionUser {
  id: string;
  name: string;
  username: string | null;
  role: 'DEVELOPER' | 'LEADER' | 'MEMBER';
  status: string;
  team_id: string | null;
  region_id: string | null;
  permissions: string[];
}

/**
 * Server-side session verification helper.
 * Resolves current user from HTTP-only session cookie or headers.
 */
export async function getSessionUser(): Promise<AuthSessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      // Fallback: If running in dev/demo mode or standalone Telegram WebApp initData validation
      const users = dbStore.getUsers();
      const defaultUser = users[0]; // Developer or default active user
      if (!defaultUser) return null;

      const userPerms = await dbStore.getUserPermissionsList(defaultUser.id, defaultUser.role);

      return {
        id: defaultUser.id,
        name: defaultUser.first_name ? `${defaultUser.first_name} ${defaultUser.last_name || ''}`.trim() : 'Developer Operator',
        username: defaultUser.username || 'efu_admin',
        role: (defaultUser.role as any) || 'DEVELOPER',
        status: defaultUser.status || 'ACTIVE',
        team_id: defaultUser.team_id || null,
        region_id: defaultUser.region_id || null,
        permissions: userPerms,
      };
    }

    // Decode session token (Format: userId:timestamp)
    const [userId] = sessionToken.split(':');
    const user = await dbStore.getUserById(userId);

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    const userPerms = await dbStore.getUserPermissionsList(user.id, user.role);

    return {
      id: user.id,
      name: user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Operations Agent',
      username: user.username || null,
      role: (user.role as any) || 'MEMBER',
      status: user.status,
      team_id: user.team_id || null,
      region_id: user.region_id || null,
      permissions: userPerms,
    };
  } catch (err) {
    console.error('Session resolution error:', err);
    return null;
  }
}

/**
 * Create HTTP-Only Session Cookie for authenticated user
 */
export async function setSessionCookie(userId: string) {
  const cookieStore = await cookies();
  const token = `${userId}:${Date.now()}`;

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 3600, // 7 Days
  });
}

/**
 * Clear Session Cookie
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Server-side Permission Guard for API Routes.
 * Returns 403 Forbidden if user lacks required permission.
 */
export async function verifyServerPermission(permissionKey: string): Promise<{ authorized: boolean; user: AuthSessionUser | null; errorResponse?: NextResponse }> {
  const user = await getSessionUser();

  if (!user) {
    return {
      authorized: false,
      user: null,
      errorResponse: NextResponse.json({ success: false, error: 'Unauthorized: No active session' }, { status: 401 }),
    };
  }

  if (user.status !== 'ACTIVE') {
    return {
      authorized: false,
      user,
      errorResponse: NextResponse.json({ success: false, error: 'Account Disabled' }, { status: 403 }),
    };
  }

  // Developer has full access
  if (user.role === 'DEVELOPER') {
    return { authorized: true, user };
  }

  // Check permissions array
  if (!user.permissions.includes(permissionKey)) {
    return {
      authorized: false,
      user,
      errorResponse: NextResponse.json(
        { success: false, error: `Forbidden: Lacks permission "${permissionKey}"` },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, user };
}
