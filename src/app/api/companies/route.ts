import { NextResponse } from 'next/server';
import { MOCK_COMPANIES } from '@/lib/mockData';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  const excludedCompanyCodes = new Set(['zain', 'asiacell', 'korek']);

  if (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('demo.supabase.co')) {
    const { data, error } = await getSupabaseAdmin()
      .from('companies')
      .select('*')
      .order('name');

    if (!error && data?.length) {
      const companiesByCode = new Map(
        [...data, ...MOCK_COMPANIES]
          .filter((company) => !excludedCompanyCodes.has(company.code.toLowerCase()))
          .map((company) => [company.code.toLowerCase(), company])
      );
      return NextResponse.json({ success: true, companies: Array.from(companiesByCode.values()) });
    }
  }

  return NextResponse.json({
    success: true,
    companies: MOCK_COMPANIES.filter((company) => !excludedCompanyCodes.has(company.code.toLowerCase())),
  });
}
