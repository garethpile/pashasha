import type { Metadata } from 'next';
import './globals.css';
import { Header } from '../components/header';
import { ChatAssistant } from '../components/support/chat-assistant';

// Use a local/system font to avoid build-time downloads (offline-friendly).
const inter = { className: 'font-sans' };

export const metadata: Metadata = {
  title: 'Pashasha Pay',
  description: 'Vibrant tipping made simple and secure with Pashasha Pay.',
  icons: {
    icon: '/pashasha-pay-logo.png',
    shortcut: '/pashasha-pay-logo.png',
    apple: '/pashasha-pay-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-amber-50 text-slate-900`}>
        <Header />
        {children}
        <ChatAssistant />
      </body>
    </html>
  );
}
