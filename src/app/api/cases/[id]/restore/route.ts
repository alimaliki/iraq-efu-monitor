import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/dbStore';
import { verifyServerPermission } from '@/lib/auth/session';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await verifyServerPermission('RESTORE_TASK');
  if (!guard.authorized) return guard.errorResponse!;

  try {
    const { id } = await params;
    const user = guard.user!;

    // Developer-Only Restore Action
    const updatedCase = await dbStore.updateCaseStatus(id, 'Last Mile', undefined, 'OPEN');
    updatedCase.archived_at = null;
    updatedCase.archived_by = null;

    // Log security audit event
    await dbStore.logAudit(user.id, 'TASK_RESTORED', 'CASE', id, `Restored archived task ${updatedCase.case_id} to active`);

    return NextResponse.json({ success: true, case: updatedCase });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
