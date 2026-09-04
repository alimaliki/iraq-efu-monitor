import { NextResponse } from 'next/server';
import { MOCK_TEAMS } from '@/lib/mockData';

export async function GET() {
  return NextResponse.json({ success: true, teams: MOCK_TEAMS });
}
