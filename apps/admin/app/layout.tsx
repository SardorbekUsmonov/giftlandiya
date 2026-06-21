import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Giftlandiya Admin', template: '%s | Admin' },
  description: 'Giftlandiya admin panel',
  robots: 'noindex',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
