import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { TelegramProvider } from '@/components/telegram/TelegramProvider';

export const metadata: Metadata = {
  title: 'IRAQ EFU MONITOR | Operations Dashboard',
  description: 'Telegram Mini App for Real-time EFU Monitoring across Iraq Provinces',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-[#070b14] text-slate-100 min-h-screen selection:bg-sky-500/30 selection:text-white antialiased">
        <TelegramProvider>{children}</TelegramProvider>
      </body>
    </html>
  );
}
