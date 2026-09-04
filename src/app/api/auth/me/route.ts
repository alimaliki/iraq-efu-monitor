import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Data Minimization: Return ONLY operational fields required by UI
  return NextResponse.json({
    success: true,
    user: {
      name: user.name,
      username: user.username,
      role: user.role,
      permissions: user.permissions,
    },
  });
}
