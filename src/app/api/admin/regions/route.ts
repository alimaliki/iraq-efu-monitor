import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/dbStore';
import { verifyServerPermission } from '@/lib/auth/session';

export async function GET() {
  const guard = await verifyServerPermission('MANAGE_REGIONS');
  if (!guard.authorized) return guard.errorResponse!;

  const provinces = dbStore.getProvinces();
  return NextResponse.json({ success: true, regions: provinces });
}
