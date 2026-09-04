import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/dbStore';

export async function GET() {
  try {
    const data = await dbStore.getDashboardData();
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
