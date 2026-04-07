'use client';

import { motion } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import { APP_LINKS } from '@/lib/constants';

const PROBLEMS = [
  'Selling on P2P — payment gets stuck in your bank for days',
  'Random OTC dealers disappear after you send USDT',
  'Bank accounts flagged or frozen due to crypto-related activity',
  'No one to contact when something goes wrong',
];

const SOLUTIONS = [
  'PKR secured before or simultaneously with your USDT transfer',
  'Verified, registered business — not anonymous',
  'Clean payment channels — zero bank freezes or flags',
  'Dedicated in-app support on every transaction',
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
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
              className="p-6 rounded-[1.5rem] bg-red-50 border border-red-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <Icon name="warning" filled size={24} className="text-red-500" />
                <h4 className="font-[family-name:var(--font-manrope)] font-bold text-lg text-red-700">
                  The Problem You&apos;re Facing
                </h4>
              </div>
              <ul className="space-y-2.5">
                {PROBLEMS.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-red-600">
                    <Icon name="cancel" filled size={16} className="text-red-400 shrink-0 mt-0.5" />
                    {p}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Solution */}
            <motion.div
              {...fadeUp(0.1)}
              className="p-6 rounded-[1.5rem] bg-green-50 border border-green-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <Icon name="check_circle" filled size={24} className="text-green-500" />
                <h4 className="font-[family-name:var(--font-manrope)] font-bold text-lg text-green-700">
                  The CoinSensei Guarantee
                </h4>
              </div>
              <ul className="space-y-2.5">
                {SOLUTIONS.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm text-green-700">
                    <Icon name="check_circle" filled size={16} className="text-green-500 shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Text column */}
          <div className="space-y-6">
            <motion.div {...fadeUp(0.05)}>
              <div className="badge w-fit">Who We Are</div>
            </motion.div>

            <motion.h2
              {...fadeUp(0.1)}
              className="font-[family-name:var(--font-manrope)] font-extrabold text-4xl text-[--color-text-pri] leading-tight"
            >
              Pakistan&apos;s Most Trusted USDT Exchange
            </motion.h2>

            <motion.p {...fadeUp(0.15)} className="text-lg text-[--color-text-sec] leading-relaxed">
              CoinSensei was built by Pakistanis, for Pakistanis. We saw the daily struggles
              of crypto traders — scams, frozen payments, unreliable dealers — and decided to
              fix it for good.
            </motion.p>

            <motion.p {...fadeUp(0.2)} className="text-[--color-text-sec] leading-relaxed">
              We are a registered digital exchange service that{' '}
              <strong className="text-[--color-text-pri] font-semibold">
                guarantees your PKR
              </strong>{' '}
              the moment we receive your USDT. No waiting. No risk. No headaches. Just fast,
              safe, and reliable crypto exchange — all inside our app.
            </motion.p>

            <motion.div {...fadeUp(0.25)}>
              <Button variant="primary" size="lg" href={APP_LINKS.web}>
                Start Trading Safely
                <Icon name="arrow_forward" size={20} className="text-white" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
