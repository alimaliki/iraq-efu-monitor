import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/dbStore';
import { sendTelegramNotification } from '@/lib/telegram/bot';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Required fields validation
    const src = body.src || body.case_id;
    if (!src || !src.trim()) {
      return NextResponse.json(
        { success: false, error: 'SRC / case_id field is required' },
        { status: 400 }
      );
    }
    if (!body.fdt || !body.fdt.trim()) {
      return NextResponse.json(
        { success: false, error: 'FDT field is required' },
        { status: 400 }
      );
    }
    if (!body.description || !body.description.trim()) {
      return NextResponse.json(
        { success: false, error: 'Description field is required' },
        { status: 400 }
      );
    }

    const importedCase = await dbStore.upsertImportedCase({
      src: src.trim(),
      fms_id: body.fms_id || body.fms_url || null,
      department: body.department || 'Support',
      region: body.region || 'Nasria',
      fdt: body.fdt.trim(),
      description: body.description.trim(),
      efu: Number(body.efu) || 0,
      maintenance: body.maintenance || 'WNS',
      status: body.status || 'Last Mile',
      escalation: body.escalation || 'Open',
      gr_request: body.gr_request,
      created_at: body.created_at,
    });

    // Send Telegram alert if Critical
    if (importedCase.priority === 'CRITICAL' || importedCase.efu >= 200) {
      await sendTelegramNotification(
        '@iraq_efu_alerts',
        `⚠️ <b>CRITICAL EFU TASK IMPORTED</b>\n\n` +
          `<b>SRC:</b> ${importedCase.case_id}\n` +
          `<b>EFU:</b> ${importedCase.efu}\n` +
          `<b>Region:</b> ${importedCase.region}\n` +
          `<b>FDT:</b> ${importedCase.fdt}\n` +
          `<b>Description:</b> ${importedCase.description}`
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Task imported and resolved to governorate successfully',
      case: importedCase,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
