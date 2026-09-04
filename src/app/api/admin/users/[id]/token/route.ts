import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/dbStore';
import { verifyServerPermission } from '@/lib/auth/session';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await verifyServerPermission('MANAGE_USERS');
  if (!guard.authorized) return guard.errorResponse!;

  try {
    const { id } = await params;
    const user = await dbStore.getUserById(id);

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const token = await dbStore.generateLinkingToken(user.id);
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'efu_maintenance_bot';
    const linkUrl = `https://t.me/${botUsername}?start=link_${token}`;

    return NextResponse.json({
      success: true,
      token,
      link_url: linkUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
