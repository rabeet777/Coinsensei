'use client';

import { motion } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';

const PROBLEMS = [
  'Limited global connectivity with traditional fiat-only channels',
  'Informal P2P networks exposing users to high scam risks and freezes',
  'Lack of compliant, transparent gateways for local settlements',
  'Formal banking channels locking you out of crypto opportunities',
];

const SOLUTIONS = [
  'Seamless integration with global digital finance systems',
  'A registered corporate portal ensuring clean PKR and safety',
  'Verifiable on-chain transfers with multi-sig custody protection',
  'Simple tools to access crypto and stable digital value',
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: false, amount: 0.15 },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
});

export default function WhatIsCoinsensei() {
  return (
    <section id="about" className="section-py bg-[--color-surface]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Problem / Solution cards */}
          <div className="space-y-4">
            {/* Problem */}
            <motion.div
              {...fadeUp(0)}
              className="feature-card p-6 rounded-[1.5rem] bg-[--color-surface-mid] border border-[--color-border]"
            >
              <div className="flex items-center gap-3 mb-4">
                <Icon name="warning" filled size={24} className="text-[--color-text-muted]" />
                <h4 className="font-[family-name:var(--font-manrope)] font-bold text-lg text-[--color-text-pri]">
                  Traditional Finance Limits
                </h4>
              </div>
              <ul className="space-y-2.5">
                {PROBLEMS.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-[--color-text-sec]">
                    <Icon name="cancel" filled size={16} className="text-[--color-text-muted] shrink-0 mt-0.5" />
                    {p}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Solution */}
            <motion.div
              {...fadeUp(0.1)}
              className="feature-card p-6 rounded-[1.5rem] bg-primary/5 border border-primary/25 hover:border-primary/50"
            >
              <div className="flex items-center gap-3 mb-4">
                <Icon name="check_circle" filled size={24} className="text-primary" />
                <h4 className="font-[family-name:var(--font-manrope)] font-bold text-lg text-[--color-text-pri]">
                  The Coinsensei Vision
                </h4>
              </div>
              <ul className="space-y-2.5">
                {SOLUTIONS.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm text-[--color-text-sec]">
                    <Icon name="check_circle" filled size={16} className="text-primary shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Text column */}
          <div className="space-y-6">
            <motion.div {...fadeUp(0.05)}>
              <div className="badge w-fit">Vision & Future</div>
            </motion.div>

            <motion.h2
              {...fadeUp(0.1)}
              className="font-[family-name:var(--font-manrope)] font-extrabold text-4xl text-[--color-text-pri] leading-tight"
            >
              Digitalizing Pakistan, one transaction at a time.
            </motion.h2>

            <motion.p {...fadeUp(0.15)} className="text-lg text-[--color-text-sec] leading-relaxed font-medium">
              Pakistan’s financial future is becoming more digital, global, and crypto-oriented. Coinsensei is here to help you buy crypto in Pakistan, providing a secure crypto exchange in Pakistan with transparent USDT to PKR rates, and clean banking integration.
            </motion.p>

            <motion.p {...fadeUp(0.2)} className="text-[--color-text-sec] leading-relaxed">
              We are building a bridge to global connectivity and stable digital value. By introducing compliant on-chain transfers and preparing for a digital financial future, we enable secure financial accessibility for all Pakistanis.
            </motion.p>

            <motion.div {...fadeUp(0.25)}>
              <Button variant="primary" size="lg" href="#waitlist">
                Join the Waitlist
                <Icon name="arrow_forward" size={20} className="text-white" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
