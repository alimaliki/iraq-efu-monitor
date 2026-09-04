import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/dbStore';
import { verifyServerPermission } from '@/lib/auth/session';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await verifyServerPermission('MANAGE_USERS');
  if (!guard.authorized) return guard.errorResponse!;

  const { id } = await params;
  const user = await dbStore.getUserById(id);

  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, user });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await verifyServerPermission('MANAGE_USERS');
  if (!guard.authorized) return guard.errorResponse!;

  try {
    const { id } = await params;
    const body = await request.json();

    const updatedUser = await dbStore.updateUser(id, {
      role: body.role,
      status: body.status,
      team_id: body.team_id,
      region_id: body.region_id,
      phone: body.phone,
      email: body.email,
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
