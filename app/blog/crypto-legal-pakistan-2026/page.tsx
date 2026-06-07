'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';

export default function BlogPostLegalityPage() {
  return (
    <>
      <Navbar />
      <main className="relative min-h-screen pt-28 pb-20 overflow-hidden bg-[--color-surface]">
        {/* Backdrop Shadows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
          <div className="absolute top-[12%] left-[-15%] w-[450px] h-[450px] rounded-full bg-primary/10 dark:bg-primary/5 blur-[130px]" />
          <div className="absolute bottom-[25%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary-dark/8 dark:bg-primary-dark/4 blur-[160px]" />
        </div>

        <div className="max-w-4xl mx-auto px-6 relative z-10">
          {/* Back button */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 text-sm font-bold text-[--color-text-muted] hover:text-primary transition-colors group"
            >
              <Icon name="arrow_back" size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              Back to Knowledge Hub
            </Link>
          </motion.div>

          {/* Article Header */}
          <div className="mb-10 border-b border-[--color-border] pb-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="badge w-fit mb-4"
            >
              Legality & Regulation
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="font-[family-name:var(--font-manrope)] font-extrabold text-3xl md:text-5xl text-[--color-text-pri] mb-6 leading-tight"
            >
              Is Crypto Legal in Pakistan in 2026? Regulatory Updates
            </motion.h1>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="flex flex-wrap items-center gap-6 text-sm text-[--color-text-muted]"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-black">
                  CS
                </div>
                <span className="font-bold text-[--color-text-pri]">CoinSensei Research Team</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Icon name="calendar_today" size={14} />
                <span>May 28, 2026</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Icon name="schedule" size={14} />
                <span>8 min read</span>
              </div>
            </motion.div>
          </div>

          {/* Article Body */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="prose prose-invert max-w-none text-[--color-text-sec] leading-relaxed space-y-6 text-base"
          >
            <p>
              The regulatory status of cryptocurrency in Pakistan is one of the most talked-about topics for local retail users and institutional finance builders. With millions of Pakistanis looking to <strong>buy crypto in Pakistan</strong> to hedge against local currency inflation, having absolute clarity on legality is critical.
            </p>
            <p>
              In this article, we look at the current legal position of virtual assets in 2026, the roles of the State Bank of Pakistan (SBP) and the Securities and Exchange Commission of Pakistan (SECP), and how to maintain a <strong>safe crypto trading</strong> profile.
            </p>

            <h2 className="text-2xl font-bold text-[--color-text-pri] mt-10 mb-4 font-[family-name:var(--font-manrope)]">
              Is Crypto Banned in Pakistan? The Reality
            </h2>
            <p>
              The short answer is: <strong>No, crypto is not banned for personal holdings.</strong>
            </p>
            <p>
              While the State Bank of Pakistan (SBP) issued an advisory circular in 2018 directing local commercial banks not to process or facilitate cryptocurrency transactions, holding, buying, or selling digital assets is not classified as an illegal or criminal act under federal law.
            </p>
            <p>
              Commercial banks are required to monitor transaction patterns. If they detect users transacting through unverified peer-to-peer (P2P) systems, they often restrict banking access to comply with SBP's risk-mitigation advisories.
            </p>

            {/* Note box */}
            <div className="my-8 p-5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-sm flex gap-3.5">
              <Icon name="info" className="shrink-0 text-sky-400" size={22} />
              <div>
                <strong className="block mb-1 text-sky-200">Legal Clarification:</strong>
                As of 2026, there is no federal legislation in Pakistan declaring the ownership of digital assets or stablecoins like USDT as a criminal offense. The current regulatory stance focuses on preventing currency outflows and informal, untracked payment structures.
              </div>
            </div>

            <h2 className="text-2xl font-bold text-[--color-text-pri] mt-10 mb-4 font-[family-name:var(--font-manrope)]">
              SECP Guidelines & The Transition to Corporate Compliance
            </h2>
            <p>
              The Securities and Exchange Commission of Pakistan (SECP) has published consultation papers regarding the regulation of digital assets. The consensus points to establishing registered corporate gateways that can process local PKR settlements safely under local regulatory supervision.
            </p>
            <p>
              By registering as a corporate technology platform (like CoinSensei Tech, SECP CUIN: 0248591), companies are building a compliant gateway. These gateways ensure that:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Every user completes standard identity verification (KYC).</li>
              <li>Transactions are settled directly through audited corporate bank channels.</li>
              <li>Conversion rates for <strong>USDT to PKR</strong> are transparent and logged for audit purposes.</li>
              <li>Informal P2P money laundering networks are bypassed completely.</li>
            </ul>

            <h2 className="text-2xl font-bold text-[--color-text-pri] mt-10 mb-4 font-[family-name:var(--font-manrope)]">
              How to Avoid Legal Issues While Trading Crypto
            </h2>
            <p>
              To keep your banking profiles and local transaction records clean, follow these guidelines:
            </p>
            <ol className="list-decimal pl-6 space-y-3 mt-4">
              <li>
                <strong>Avoid Informal P2P Networks:</strong> Trading on global P2P boards exposes your account to black-market funds, leading to automated FIA banking restrictions.
              </li>
              <li>
                <strong>Declare Your Source of Income:</strong> When registering on a compliant <strong>crypto exchange in Pakistan</strong>, provide clear income information to help banks process larger volume transfers.
              </li>
              <li>
                <strong>Keep Tax Records:</strong> Under Pakistan's capital gains framework, keeping logs of your conversion entries helps resolve any regulatory questions.
              </li>
            </ol>

            <h2 className="text-2xl font-bold text-[--color-text-pri] mt-10 mb-4 font-[family-name:var(--font-manrope)]">
              The Path Forward: Compliant Gateways
            </h2>
            <p>
              CoinSensei is leading this compliance shift. Operating as a registered private limited tech company in Pakistan, we work under SECP guidance to create a safe, auditable local sandbox environment. This allows users to experience direct banking and mobile wallet deposits without risking unverified, grey-market P2P transactions.
            </p>

            {/* Bottom Waitlist CTA card */}
            <div className="mt-12 p-8 rounded-3xl bg-[--color-surface-mid] border border-[--color-border] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex-1 text-left">
                <h4 className="font-[family-name:var(--font-manrope)] font-bold text-xl text-[--color-text-pri] mb-2">
                  Ready to Experience Safe Crypto?
                </h4>
                <p className="text-xs text-[--color-text-muted] leading-relaxed">
                  Register for early waitlist access to lock in your position on Pakistan's premier compliant exchange sandbox.
                </p>
              </div>
              <Button variant="primary" size="lg" href="/#waitlist" className="w-full md:w-auto">
                Join the Waitlist
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
