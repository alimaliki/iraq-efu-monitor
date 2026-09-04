'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { TelegramUser, TelegramWebApp } from '@/types/telegram';

interface TelegramContextType {
  user: TelegramUser | null;
  webApp: TelegramWebApp | null;
  isTelegram: boolean;
  isLoading: boolean;
}

const TelegramContext = createContext<TelegramContextType>({
  user: null,
  webApp: null,
  isTelegram: false,
  isLoading: true,
});

export const useTelegram = () => useContext(TelegramContext);

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [isTelegram, setIsTelegram] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if Telegram WebApp script/object is loaded
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const app = window.Telegram.WebApp;
      setWebApp(app);
      app.ready();
      app.expand();
      
      // Customize Telegram WebApp Header & Background colors for operations theme
      try {
        app.setHeaderColor('#070b14');
        app.setBackgroundColor('#070b14');
      } catch {
        // ignore if version doesn't support color overrides
      }

      const tgUser = app.initDataUnsafe?.user;
      if (tgUser) {
        setUser(tgUser);
        setIsTelegram(true);

        // Sync with backend API
        fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: app.initData }),
        }).catch(err => console.error('Auth sync failed:', err));
      } else {
        // Standalone desktop/browser fallback user
        setUser({
          id: 77712345,
          first_name: 'Operations',
          last_name: 'Commander',
          username: 'iraq_efu_admin',
          language_code: 'en',
        });
      }
    } else {
      // Browser environment outside Telegram Mini App
      setUser({
        id: 77712345,
        first_name: 'Operations',
        last_name: 'Commander',
        username: 'iraq_efu_admin',
        language_code: 'en',
      });
    }
    setIsLoading(false);
  }, []);

  return (
    <TelegramContext.Provider value={{ user, webApp, isTelegram, isLoading }}>
      {children}
    </TelegramContext.Provider>
  );
}
