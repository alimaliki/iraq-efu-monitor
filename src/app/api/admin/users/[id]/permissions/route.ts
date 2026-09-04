import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/dbStore';
import { verifyServerPermission } from '@/lib/auth/session';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await verifyServerPermission('MANAGE_PERMISSIONS');
  if (!guard.authorized) return guard.errorResponse!;

  const { id } = await params;
  const user = await dbStore.getUserById(id);

  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  const permissions = await dbStore.getUserPermissionsList(user.id, user.role);
  return NextResponse.json({ success: true, permissions });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await verifyServerPermission('MANAGE_PERMISSIONS');
  if (!guard.authorized) return guard.errorResponse!;

  try {
    const { id } = await params;
    const body = await request.json();
    const { permission_key, allowed } = body;

    if (!permission_key || typeof allowed !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Missing permission_key or allowed boolean' }, { status: 400 });
    }

    await dbStore.setUserPermissionOverride(id, permission_key, allowed);
    return NextResponse.json({ success: true, message: `Permission ${permission_key} set to ${allowed}` });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
