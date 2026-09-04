import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/dbStore';
import { verifyServerPermission } from '@/lib/auth/session';

export async function GET() {
  const guard = await verifyServerPermission('MANAGE_USERS');
  if (!guard.authorized) return guard.errorResponse!;

  const users = dbStore.getUsers();
  return NextResponse.json({ success: true, users });
}

export async function POST(request: Request) {
  const guard = await verifyServerPermission('MANAGE_USERS');
  if (!guard.authorized) return guard.errorResponse!;

  try {
    const body = await request.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const newUser = await dbStore.createUser({
      name: body.name.trim(),
      email: body.email,
      phone: body.phone,
      role: body.role || 'MEMBER',
      team_id: body.team_id,
      region_id: body.region_id,
      status: body.status || 'ACTIVE',
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
