import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/dbStore';
import { sendTelegramNotification } from '@/lib/telegram/bot';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, team_id } = body;

    const nowISO = new Date().toISOString();
    const isCompleted = status === 'RESOLVED' || status === 'CLOSED' || status === 'Resolved' || status === 'Closed';
    const isReopening = status === 'IN_PROGRESS' || status === 'In Progress' || status === 'ACKNOWLEDGED' || status === 'Last Mile' || status === 'Pending';

    let escalationVal = body.escalation;
    if (isCompleted) {
      escalationVal = 'CLOSED';
    } else if (isReopening) {
      escalationVal = 'OPEN';
    }

    const updatedCase = await dbStore.updateCaseStatus(id, status, team_id, escalationVal);

    if (isCompleted) {
      updatedCase.closed_at = updatedCase.closed_at || nowISO;
      updatedCase.archived_at = updatedCase.archived_at || nowISO;

      // Log audit
      await dbStore.logAudit('system', 'TASK_CLOSED', 'CASE', id, `Closed and archived task ${updatedCase.case_id}`);

      // Send Telegram alert when RESOLVED or CLOSED
      await sendTelegramNotification(
        '@iraq_efu_alerts',
        `✅ <b>CASE RESOLVED & ARCHIVED</b>\n\n` +
          `<b>Case ID:</b> ${updatedCase.case_id}\n` +
          `<b>Status:</b> ${status}\n` +
          `<b>Escalation:</b> CLOSED\n` +
          `<b>FDT:</b> ${updatedCase.fdt}`
      );
    } else if (isReopening) {
      updatedCase.escalation = 'OPEN';
      updatedCase.closed_at = null;
      updatedCase.archived_at = null;
      updatedCase.closed_by = null;
      updatedCase.archived_by = null;

      await dbStore.logAudit('system', 'TASK_REOPENED', 'CASE', id, `Reopened task ${updatedCase.case_id} to ${status} with Escalation OPEN`);
    }

    return NextResponse.json({ success: true, case: updatedCase });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
