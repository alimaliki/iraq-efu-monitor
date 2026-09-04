import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/dbStore';
import { sendTelegramMessage, sendTelegramReplyKeyboard } from '@/lib/telegram/bot';
import { normalizeRole } from '@/lib/auth/rbac';

export async function POST(request: Request) {
  try {
    const update = await request.json();
    const message = update.message || update.edited_message;
    const callbackQuery = update.callback_query;

    const sender = message ? message.from : callbackQuery ? callbackQuery.from : null;

    if (!sender) {
      return NextResponse.json({ ok: true });
    }

    const telegramId = sender.id;
    const chatId = message ? message.chat.id : callbackQuery ? callbackQuery.message.chat.id : telegramId;
    const text = message ? message.text || '' : '';

    // Check internal user record
    let user = await dbStore.getUserByTelegramId(telegramId);
    const isDeveloper = user && normalizeRole(user.role) === 'DEVELOPER';

    // 1. LINKING TOKEN PARAMETER CHECK (/start link_TOKEN)
    if (text.startsWith('/start link_')) {
      const token = text.replace('/start ', '').trim();
      const linkedUser = await dbStore.validateAndLinkTelegram(token, sender);

      if (linkedUser) {
        await sendTelegramMessage(
          chatId,
          `✅ <b>TELEGRAM ACCOUNT LINKED SUCCESSFULLY!</b>\n\n` +
            `Welcome, <b>${linkedUser.first_name}</b>!\n` +
            `Your Telegram identity is now verified and linked to your internal account.\n\n` +
            `Click below to launch the Mini App.`
        );
        return NextResponse.json({ ok: true });
      } else {
        await sendTelegramMessage(
          chatId,
          `❌ <b>LINKING FAILED OR TOKEN EXPIRED</b>\n\n` +
            `The linking token is invalid, expired, or already used.\n` +
            `Please ask your Administrator to generate a new linking token.`
        );
        return NextResponse.json({ ok: true });
      }
    }

    // 2. /start COMMAND HANDLING
    if (text === '/start') {
      dbStore.clearBotState(telegramId);

      if (isDeveloper) {
        await sendTelegramReplyKeyboard(chatId, `🤖 <b>MAINTENANCE CONTROL SYSTEM (DEVELOPER ADMIN)</b>\n\nWelcome Master Controller! Select an administrative management menu below:`, [
          [{ text: '👥 Users' }, { text: '🔐 Permissions' }],
          [{ text: '👷 Teams' }, { text: '📍 Regions' }],
          [{ text: '📊 Statistics' }, { text: '📋 Audit Log' }],
          [{ text: '📦 Task Archive' }, { text: '🚀 OPEN APP', web_app: { url: process.env.TELEGRAM_MINI_APP_URL || 'http://localhost:3000' } }],
        ]);
      } else {
        // Normal User / Leader view
        await sendTelegramReplyKeyboard(chatId, `🛠️ <b>IRAQ EFU MAINTENANCE MONITOR</b>\n\nClick below to open your authorized Operations Dashboard.`, [
          [{ text: '📦 Task Archive' }, { text: '🚀 OPEN APP', web_app: { url: process.env.TELEGRAM_MINI_APP_URL || 'http://localhost:3000' } }],
        ]);
      }
      return NextResponse.json({ ok: true });
    }

    // Unauthenticated Telegram users trying to access menu
    if (!user) {
      await sendTelegramMessage(
        chatId,
        `⚠️ <b>ACCESS RESTRICTED</b>\n\n` +
          `Your Telegram account is not linked to any internal Maintenance Operator account.\n` +
          `Please contact your System Administrator to receive an activation link.`
      );
      return NextResponse.json({ ok: true });
    }

    // 3. DEVELOPER ADMIN BOT KEYBOARD MENUS
    if (isDeveloper) {
      if (text === '👥 Users') {
        const users = dbStore.getUsers();
        let userListText = `👥 <b>USER MANAGEMENT DIRECTORY (${users.length})</b>\n\n`;

        users.forEach((u, i) => {
          const statusIcon = u.status === 'ACTIVE' ? '🟢' : '🔴';
          const linkIcon = u.telegram_user_id ? '🔗 LINKED' : '❌ UNLINKED';
          userListText += `${i + 1}. <b>${u.first_name} ${u.last_name || ''}</b> (${u.role})\n`;
          userListText += `   Status: ${statusIcon} ${u.status} | Telegram: ${linkIcon}\n\n`;
        });

        userListText += `<i>Use /adduser to create a new user, or /link_user [id] to generate a linking token.</i>`;
        await sendTelegramMessage(chatId, userListText);
        return NextResponse.json({ ok: true });
      }

      if (text === '📦 Task Archive') {
        const { cases } = await dbStore.getDashboardData();
        const archivedCases = cases.filter((c) => c.status === 'CLOSED' || c.status === 'RESOLVED' || c.status === 'ARCHIVED');
        await sendTelegramMessage(
          chatId,
          `📦 <b>TASK ARCHIVE SUMMARY (${archivedCases.length})</b>\n\n` +
            `Total archived historical cases: <b>${archivedCases.length}</b>\n` +
            `Open your Mini App to search, filter date ranges, and view read-only historical SLA details.`
        );
        return NextResponse.json({ ok: true });
      }

      if (text === '📊 Statistics') {
        const { stats } = await dbStore.getDashboardData();
        await sendTelegramMessage(
          chatId,
          `📊 <b>LIVE OPERATIONS SYSTEM STATISTICS</b>\n\n` +
            `• <b>Active Cases:</b> ${stats.activeCases}\n` +
            `• <b>Total EFU Sum:</b> ${stats.totalEFU}\n` +
            `• <b>Affected Users:</b> ${stats.affectedUsers}\n` +
            `• <b>Critical Cases:</b> ${stats.criticalCases}\n` +
            `• <b>Overdue >4H SLA:</b> ${stats.casesOlderThan4Hours}`
        );
        return NextResponse.json({ ok: true });
      }

      if (text === '📋 Audit Log') {
        const logs = dbStore.getAuditLogs().slice(0, 8);
        let logText = `📋 <b>RECENT SECURITY AUDIT LOGS</b>\n\n`;

        if (logs.length === 0) {
          logText += `<i>No audit logs recorded yet.</i>`;
        } else {
          logs.forEach((l) => {
            logText += `• <b>${l.action}</b>: ${l.description}\n  <i>${new Date(l.created_at).toLocaleTimeString()}</i>\n\n`;
          });
        }
        await sendTelegramMessage(chatId, logText);
        return NextResponse.json({ ok: true });
      }

      if (text === '🔐 Permissions') {
        await sendTelegramMessage(
          chatId,
          `🔐 <b>ROLE PERMISSION MATRIX</b>\n\n` +
            `• <b>DEVELOPER:</b> Full Administrative Control\n` +
            `• <b>LEADER:</b> Team & Region Management + Incident Resolution\n` +
            `• <b>MEMBER:</b> Dashboard & Field Note Logging\n\n` +
            `<i>Manage specific user overrides via Web Admin API or /grant_perm.</i>`
        );
        return NextResponse.json({ ok: true });
      }

      if (text === '👷 Teams' || text === '📍 Regions') {
        const teams = dbStore.getTeams();
        let teamText = `👷 <b>MAINTENANCE TEAMS & REGIONS (${teams.length})</b>\n\n`;
        teams.forEach((t) => {
          teamText += `• <b>${t.name}</b> (${t.code}) - Status: ${t.status}\n`;
        });
        await sendTelegramMessage(chatId, teamText);
        return NextResponse.json({ ok: true });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Bot Webhook error:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
