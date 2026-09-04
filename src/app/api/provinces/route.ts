import { NextResponse } from 'next/server';
import { MOCK_PROVINCES } from '@/lib/mockData';

export async function GET() {
  return NextResponse.json({ success: true, provinces: MOCK_PROVINCES });
}
