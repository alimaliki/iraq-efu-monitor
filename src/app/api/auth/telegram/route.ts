import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/lib/telegram/init-data';
import { sanitizeUserForClient, normalizeRole } from '@/lib/auth/rbac';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { initData } = body;

    if (!initData) {
      return NextResponse.json({ success: false, error: 'Missing initData' }, { status: 400 });
    }

    const validation = validateTelegramWebAppData(initData, process.env.TELEGRAM_BOT_TOKEN);

    if (!validation.isValid) {
      return NextResponse.json({ success: false, error: 'Invalid Telegram WebApp HMAC signature' }, { status: 401 });
    }

    const rawUser = validation.user || {
      first_name: 'Operations',
      last_name: 'Agent',
      username: 'efu_operator',
      role: 'MEMBER',
    };

    // Sanitize payload for client UI (Remove raw Telegram ID, DB UUIDs, Supabase details)
    const clientUser = sanitizeUserForClient(rawUser);

    return NextResponse.json({
      success: true,
      user: clientUser,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
