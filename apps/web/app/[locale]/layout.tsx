import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import '../globals.css';

const geist = Geist({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-geist',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: "Giftlandiya — Sovg'a va Dekor Do'koni", template: '%s | Giftlandiya' },
  description: "O'zbekistondagi eng yaxshi sovg'a, uy bezaklari va suvenir do'koni",
  metadataBase: new URL('https://giftlandiya.uz'),
};

export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geist.variable} font-sans min-h-screen bg-[#FAFAFA] antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          {children}
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
