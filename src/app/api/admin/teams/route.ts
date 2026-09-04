import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/dbStore';
import { verifyServerPermission } from '@/lib/auth/session';

export async function GET() {
  const guard = await verifyServerPermission('MANAGE_TEAMS');
  if (!guard.authorized) return guard.errorResponse!;

  const teams = dbStore.getTeams();
  return NextResponse.json({ success: true, teams });
}
