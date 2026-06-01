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
      <main>
        <PrivacyPolicy />
      </main>
      <Footer />
    </>
  );
}
