import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/dbStore';
import { verifyServerPermission } from '@/lib/auth/session';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await verifyServerPermission('RESOLVE_CASE');
  if (!guard.authorized) return guard.errorResponse!;

  try {
    const { id } = await params;
    const user = guard.user!;
    const nowISO = new Date().toISOString();

    // Atomic Task Closure & Archiving Transaction
    const updatedCase = await dbStore.updateCaseStatus(id, 'CLOSED', undefined, 'CLOSED');
    
    // Set closing and archiving metadata
    updatedCase.closed_at = nowISO;
    updatedCase.closed_by = user.id;
    updatedCase.archived_at = nowISO;
    updatedCase.archived_by = user.id;

    // Log security audit events
    await dbStore.logAudit(user.id, 'TASK_CLOSED', 'CASE', id, `Closed task ${updatedCase.case_id}`);
    await dbStore.logAudit(user.id, 'TASK_ARCHIVED', 'CASE', id, `Archived completed task ${updatedCase.case_id}`);

    return NextResponse.json({ success: true, case: updatedCase });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
