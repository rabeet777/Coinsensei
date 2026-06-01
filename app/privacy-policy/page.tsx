import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PrivacyPolicy from './PrivacyPolicy';

export const metadata: Metadata = {
  title: 'Privacy Policy — CoinSensei',
  description:
    "CoinSensei's Privacy Policy explains how we collect, use, store, and protect your personal information when you use Pakistan's secure virtual asset gateway.",
  keywords: [
    'CoinSensei privacy policy',
    'virtual asset privacy',
    'digital asset privacy',
    'Pakistan crypto data protection',
    'KYC privacy',
  ],
  alternates: {
    canonical: '/privacy-policy',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
    },
  },
  openGraph: {
    title: 'Privacy Policy — CoinSensei',
    description:
      'How CoinSensei collects, uses, and protects your information. Pakistan’s secure virtual asset gateway.',
    type: 'article',
    locale: 'en_PK',
    url: '/privacy-policy',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy — CoinSensei',
    description:
      'How CoinSensei collects, uses, and protects your information.',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden">
        {/* Drifting Ambient Background Shadow Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
          <div className="absolute top-[10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-primary/10 dark:bg-primary/5 blur-[120px] animate-blob" />
          <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary-dark/8 dark:bg-primary-dark/4 blur-[150px] animate-blob" style={{ animationDelay: '4s' }} />
          <div className="absolute top-[55%] left-[-5%] w-[450px] h-[450px] rounded-full bg-primary-light/8 dark:bg-primary-light/4 blur-[130px] animate-blob" style={{ animationDelay: '8s' }} />
          <div className="absolute top-[75%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/8 dark:bg-primary/4 blur-[140px] animate-blob" style={{ animationDelay: '12s' }} />
          <div className="absolute bottom-[2%] left-[10%] w-[380px] h-[380px] rounded-full bg-primary-dark/8 dark:bg-primary-dark/4 blur-[110px] animate-blob" style={{ animationDelay: '16s' }} />
        </div>
        <PrivacyPolicy />
      </main>
      <Footer />
    </>
  );
}
