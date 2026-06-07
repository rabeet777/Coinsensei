'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import Icon from '@/components/ui/Icon';

const SHOWCASE_TABS = [
  {
    id: 'wallet',
    label: 'Portfolio Wallet',
    title: 'Real-Time Balance Tracking',
    desc: 'View your total portfolio balance, PKR holdings, and USDT side-by-side. Perform quick deposits and withdrawals instantly.',
    image: '/app-wallet.png',
    features: [
      { icon: 'account_balance_wallet', title: 'Side-by-Side Balances', text: 'Track PKR and USDT holdings easily at a single glance.' },
      { icon: 'bolt', title: 'Instant Actions', text: 'Convert, deposit, or withdraw in just a few taps.' },
    ],
  },
  {
    id: 'history',
    label: 'Transaction History',
    title: 'On-Chain Ledger Transparency',
    desc: 'View completed PKR and Crypto transaction lists. Trace the status of your approved deposits, withdrawals, and in-app Coinsensei transfers.',
    image: '/app-history-crypto.png',
    features: [
      { icon: 'history', title: 'Detailed Records', text: 'Filter transaction details with full status logs.' },
      { icon: 'swap_horiz', title: 'Multi-Asset History', text: 'Track both PKR cash bank transfers and USDT on-chain details.' },
    ],
  },
  {
    id: 'p2p',
    label: 'P2P History',
    title: 'Safe Peer-to-Peer Settlement',
    desc: 'Track all your buy and sell transaction rates, amounts, and statuses. Easily view and share payment receipts for total verification.',
    image: '/app-p2p-history.png',
    features: [
      { icon: 'handshake', title: 'Secure P2P Trading', text: 'Complete logs of all P2P buy and sell agreements.' },
      { icon: 'share', title: 'Shareable Receipts', text: 'Instantly download or share verified payment slips.' },
    ],
  },
] as const;

export default function ProductShowcase() {
  const [activeTabId, setActiveTabId] = useState<string>('wallet');
  const activeTab = SHOWCASE_TABS.find((t) => t.id === activeTabId) ?? SHOWCASE_TABS[0];

  const phoneRef = useRef<HTMLDivElement>(null);
  const phoneX = useMotionValue(0);
  const phoneY = useMotionValue(0);

  const phoneRotateX = useTransform(phoneY, [-150, 150], [12, -12]);
  const phoneRotateY = useTransform(phoneX, [-150, 150], [-12, 12]);

  const handlePhoneMouseMove = (e: React.MouseEvent) => {
    if (!phoneRef.current) return;
    const rect = phoneRef.current.getBoundingClientRect();
    const xVal = e.clientX - rect.left - rect.width / 2;
    const yVal = e.clientY - rect.top - rect.height / 2;
    phoneX.set(xVal);
    phoneY.set(yVal);
  };

  const handlePhoneMouseLeave = () => {
    animate(phoneX, 0, { duration: 0.5 });
    animate(phoneY, 0, { duration: 0.5 });
  };

  return (
    <section id="showcase" className="section-py bg-[--color-surface-mid] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] rounded-full bg-primary/4 blur-[140px] z-0 pointer-events-none select-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="badge w-fit mx-auto mb-4">Application Preview</div>
          <h2 className="font-[family-name:var(--font-manrope)] font-extrabold text-4xl text-[--color-text-pri] mb-4">
            Take a Look Inside CoinSensei
          </h2>
          <p className="text-[--color-text-sec] max-w-xl mx-auto leading-relaxed">
            Explore the clean, interactive, and high-fidelity interface designed for Pakistan’s crypto future.
          </p>
        </div>

        {/* Tab Buttons bar */}
        <div className="flex justify-center mb-16">
          <div className="flex bg-[--color-surface] p-1.5 rounded-2xl border border-transparent shadow-md max-w-full overflow-x-auto no-scrollbar">
            {SHOWCASE_TABS.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`relative px-6 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 shrink-0 cursor-pointer ${
                    isActive ? 'text-[--color-text-pri]' : 'text-[--color-text-muted] hover:text-[--color-text-sec]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeShowcaseTab"
                      className="absolute inset-0 bg-[--color-surface-card] rounded-xl shadow-sm border border-white/5"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid: Description vs Image */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Left: Content Description (5 columns) */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="space-y-6"
              >
                <div>
                  <h3 className="font-[family-name:var(--font-manrope)] font-bold text-2xl text-[--color-text-pri] mb-3">
                    {activeTab.title}
                  </h3>
                  <p className="text-[--color-text-sec] leading-relaxed text-sm">
                    {activeTab.desc}
                  </p>
                </div>

                {/* Sub Features grid */}
                <div className="space-y-5 pt-4">
                  {activeTab.features.map((feat, idx) => (
                    <div key={idx} className="flex gap-4 items-start group">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary group-hover:scale-105 transition-transform">
                        <Icon name={feat.icon} size={20} filled />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[--color-text-pri] mb-0.5 group-hover:text-primary transition-colors">
                          {feat.title}
                        </h4>
                        <p className="text-xs text-[--color-text-muted] leading-relaxed">
                          {feat.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: Mockup Image inside phone-like container (7 columns) */}
          <div className="lg:col-span-7 flex justify-center items-center">
            <div 
              className="relative w-full max-w-[270px] aspect-[9/18.5] select-none"
              style={{ perspective: 1200 }}
            >
              {/* Radial glow */}
              <div className="absolute inset-0 bg-primary/15 rounded-full blur-[64px] z-0 pointer-events-none" />

              <motion.div
                ref={phoneRef}
                onMouseMove={handlePhoneMouseMove}
                onMouseLeave={handlePhoneMouseLeave}
                style={{ 
                  rotateX: phoneRotateX, 
                  rotateY: phoneRotateY,
                  transformStyle: 'preserve-3d'
                }}
                className="relative z-10 w-full h-auto cursor-pointer filter drop-shadow-[0_25px_50px_rgba(0,0,0,0.4)]"
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeTab.id}
                    src={activeTab.image}
                    alt={activeTab.title}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                    className="w-full h-auto object-contain"
                  />
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
