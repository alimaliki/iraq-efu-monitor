import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/dbStore';
import { verifyServerPermission } from '@/lib/auth/session';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const teamId = searchParams.get('teamId');
    const maintenance = searchParams.get('maintenance');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const query = searchParams.get('query')?.toLowerCase();

    const { cases } = await dbStore.getDashboardData();

    // Archived cases include all cases where archived_at/closed_at is set, status is CLOSED/RESOLVED/ARCHIVED, escalation is CLOSED, or case is inactive
    let archivedCases = cases.filter((c) => {
      if (c.archived_at || c.closed_at) return true;
      const s = (c.status || '').toUpperCase();
      const e = (c.escalation || '').toUpperCase();
      return (
        s === 'CLOSED' ||
        s === 'RESOLVED' ||
        s === 'ARCHIVED' ||
        e === 'CLOSED'
      );
    });

    if (region && region !== 'ALL') {
      archivedCases = archivedCases.filter((c) => (c.region || '').toLowerCase() === region.toLowerCase());
    }
    if (teamId && teamId !== 'ALL') {
      archivedCases = archivedCases.filter((c) => c.assigned_team_id === teamId);
    }
    if (maintenance && maintenance !== 'ALL') {
      archivedCases = archivedCases.filter((c) => c.maintenance === maintenance);
    }
    if (status && status !== 'ALL') {
      archivedCases = archivedCases.filter((c) => c.status === status);
    }
    if (dateFrom) {
      const fromMs = new Date(dateFrom).getTime();
      archivedCases = archivedCases.filter((c) => new Date(c.created_at).getTime() >= fromMs);
    }
    if (dateTo) {
      const toMs = new Date(dateTo).getTime();
      archivedCases = archivedCases.filter((c) => new Date(c.created_at).getTime() <= toMs);
    }
    if (query) {
      archivedCases = archivedCases.filter(
        (c) =>
          c.case_id.toLowerCase().includes(query) ||
          (c.fms_url || '').toLowerCase().includes(query) ||
          c.fdt.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          (c.region || '').toLowerCase().includes(query)
      );
    }

    return NextResponse.json({ success: true, cases: archivedCases });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
