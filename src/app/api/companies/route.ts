import { NextResponse } from 'next/server';
import { MOCK_COMPANIES } from '@/lib/mockData';

export async function GET() {
  return NextResponse.json({ success: true, companies: MOCK_COMPANIES });
}
