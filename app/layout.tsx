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
  title: "CoinSensei — Digitalizing Pakistan's Virtual Asset Future",
  description:
    "Secure, simple, and modern platform for virtual assets in Pakistan. Join the waitlist for seamless PKR & USDT conversions, live rates, and compliant on-chain transfers.",
  keywords: ['CoinSensei', 'Virtual Assets Pakistan', 'USDT', 'PKR', 'On-chain transfers', 'Tokenized finance', 'Pakistan Web3'],
  openGraph: {
    title: "CoinSensei — Digitalizing Pakistan's Virtual Asset Future",
    description: 'Secure, simple, and modern platform for virtual assets in Pakistan. Join the waitlist today.',
    type: 'website',
    locale: 'en_PK',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'dark';
                  if (theme === 'light') {
                    document.documentElement.classList.add('light');
                  } else {
                    document.documentElement.classList.remove('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <meta
          name="facebook-domain-verification"
          content="oyxvmp766k71l9wv8gop2j5y9ssfk9"
        />
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
