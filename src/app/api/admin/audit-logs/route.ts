import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/dbStore';
import { verifyServerPermission } from '@/lib/auth/session';

export async function GET() {
  const guard = await verifyServerPermission('VIEW_AUDIT_LOG');
  if (!guard.authorized) return guard.errorResponse!;

  const logs = dbStore.getAuditLogs();
  return NextResponse.json({ success: true, logs });
}
