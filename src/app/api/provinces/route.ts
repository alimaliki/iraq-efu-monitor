import { NextResponse } from 'next/server';
import { MOCK_PROVINCES } from '@/lib/mockData';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  if (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('demo.supabase.co')) {
    const { data, error } = await getSupabaseAdmin()
      .from('provinces')
      .select('*')
      .order('name');

    if (!error && data) {
      return NextResponse.json({ success: true, provinces: data });
    }
  }

  return NextResponse.json({ success: true, provinces: MOCK_PROVINCES });
}
