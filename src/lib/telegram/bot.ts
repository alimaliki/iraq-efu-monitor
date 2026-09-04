/**
 * Server-side helper to send notifications & reply keyboards via Telegram Bot API
 */
export async function sendTelegramNotification(chatId: string | number, text: string) {
  return sendTelegramMessage(chatId, text);
}

export async function sendTelegramMessage(chatId: string | number, text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken || botToken === 'demo-bot-token') {
    console.log('[Telegram Bot Message Logged (Dev Mode)]:', text);
    return true;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    return res.ok;
  } catch (err) {
    console.error('Failed to send Telegram message:', err);
    return false;
  }
}

export async function sendTelegramReplyKeyboard(chatId: string | number, text: string, keyboard: any[]) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken || botToken === 'demo-bot-token') {
    console.log('[Telegram Bot Reply Keyboard Logged (Dev Mode)]:', text, keyboard);
    return true;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: {
          keyboard,
          resize_keyboard: true,
          persistent: true,
        },
      }),
    });

    return res.ok;
  } catch (err) {
    console.error('Failed to send Telegram reply keyboard:', err);
    return false;
  }
}
