import crypto from 'crypto';
import { TelegramUser } from '@/types/telegram';

export interface ValidatedTelegramData {
  user?: TelegramUser;
  authDate?: number;
  queryId?: string;
  isValid: boolean;
}

/**
 * Validates Telegram WebApp initData string against Telegram Bot Token
 * using HMAC-SHA256 cryptographic signature checks.
 */
export function validateTelegramWebAppData(initData: string, botToken?: string): ValidatedTelegramData {
  const token = botToken || process.env.TELEGRAM_BOT_TOKEN;
  
  if (!initData || !token || token === 'demo-bot-token') {
    // If no initData or token in dev mode, return safe fallback status
    try {
      const urlParams = new URLSearchParams(initData);
      const userStr = urlParams.get('user');
      if (userStr) {
        const user = JSON.parse(userStr) as TelegramUser;
        return { user, isValid: true };
      }
    } catch {
      // ignore
    }
    return { isValid: true }; // allow dev environment access
  }

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    
    if (!hash) {
      return { isValid: false };
    }

    urlParams.delete('hash');
    
    // Sort keys alphabetically
    const params: string[] = [];
    urlParams.forEach((val, key) => {
      params.push(`${key}=${val}`);
    });
    params.sort();

    const dataCheckString = params.join('\n');

    // Create HMAC secret key from WebAppData string
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(token)
      .digest();

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    const isValid = calculatedHash === hash;
    const userStr = urlParams.get('user');
    const user = userStr ? (JSON.parse(userStr) as TelegramUser) : undefined;
    const authDateStr = urlParams.get('auth_date');
    const authDate = authDateStr ? parseInt(authDateStr, 10) : undefined;

    return {
      isValid,
      user,
      authDate,
      queryId: urlParams.get('query_id') || undefined
    };
  } catch (error) {
    console.error('Error validating Telegram initData:', error);
    return { isValid: false };
  }
}
