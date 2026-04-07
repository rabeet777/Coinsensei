import type { Metadata } from 'next';
import { Manrope, Inter } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: "CoinSensei — Pakistan's Trusted USDT to PKR Exchange",
  description:
    "Sell USDT and receive PKR — instantly and guaranteed. Pakistan's safest crypto exchange. No scams, no bank holds.",
  keywords: ['USDT', 'PKR', 'Pakistan', 'crypto exchange', 'CoinSensei', 'USDT to PKR'],
  openGraph: {
    title: "CoinSensei — Pakistan's Trusted USDT to PKR Exchange",
    description: 'Guaranteed payment. Zero scam risk. Instant PKR transfers.',
    type: 'website',
    locale: 'en_PK',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased bg-[--color-surface] text-[--color-text-pri]">
        {children}
      </body>
    </html>
  );
}
