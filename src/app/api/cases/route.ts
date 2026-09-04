import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/dbStore';
import { sendTelegramNotification } from '@/lib/telegram/bot';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const provinceId = searchParams.get('provinceId');
    const status = searchParams.get('status');
    const query = searchParams.get('query')?.toLowerCase();

    const { cases } = await dbStore.getDashboardData();
    let filtered = [...cases];

    if (companyId && companyId !== 'ALL') {
      filtered = filtered.filter((c) => c.company_id === companyId);
    }
    if (provinceId && provinceId !== 'ALL') {
      filtered = filtered.filter((c) => c.province_id === provinceId);
    }
    if (status && status !== 'ALL') {
      if (status === 'ACTIVE') {
        filtered = filtered.filter(
          (c) => c.status === 'OPEN' || c.status === 'ACKNOWLEDGED' || c.status === 'IN_PROGRESS'
        );
      } else {
        filtered = filtered.filter((c) => c.status === status);
      }
    }
    if (query) {
      filtered = filtered.filter(
        (c) =>
          c.case_id.toLowerCase().includes(query) ||
          c.fdt.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({ success: true, cases: filtered });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const newCase = await dbStore.createCase({
      case_id: body.case_id,
      company_id: body.company_id,
      province_id: body.province_id,
      fdt: body.fdt,
      description: body.description,
      efu: Number(body.efu) || 0,
      affected_users: Number(body.affected_users) || 0,
      priority: body.priority || 'MEDIUM',
      status: body.status || 'OPEN',
      assigned_team_id: body.assigned_team_id || null,
    });

    // Send Telegram alert if Critical
    if (newCase.priority === 'CRITICAL' || newCase.efu >= 200) {
      await sendTelegramNotification(
        '@iraq_efu_alerts',
        `⚠️ <b>CRITICAL EFU CASE CREATED</b>\n\n` +
          `<b>Case ID:</b> ${newCase.case_id}\n` +
          `<b>EFU:</b> ${newCase.efu}\n` +
          `<b>FDT:</b> ${newCase.fdt}\n` +
          `<b>Description:</b> ${newCase.description}`
      );
    }

    return NextResponse.json({ success: true, case: newCase }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
