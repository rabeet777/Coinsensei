'use client';

import { useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';

const PROBLEMS = [
  'Limited global connectivity with traditional fiat-only channels',
  'Informal P2P networks exposing users to high scam risks and freezes',
  'Lack of compliant, transparent gateways for local settlements',
  'Siloed financial systems offering zero access to tokenization',
];

const SOLUTIONS = [
  'Seamless integration with global digital finance systems',
  'A registered corporate portal ensuring clean PKR and safety',
  'Verifiable on-chain transfers with multi-sig custody protection',
  'Simple tools to access virtual assets and stable digital value',
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: false, amount: 0.15 },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
});

export default function WhatIsCoinsensei() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const shadowX = useTransform(mouseX, [-500, 500], [25, -25]);
  const shadowY = useTransform(mouseY, [-500, 500], [25, -25]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const xVal = e.clientX - rect.left - rect.width / 2;
    const yVal = e.clientY - rect.top - rect.height / 2;
    mouseX.set(xVal);
    mouseY.set(yVal);
  };

  const handleMouseLeave = () => {
    animate(mouseX, 0, { duration: 0.5 });
    animate(mouseY, 0, { duration: 0.5 });
  };

  return (
    <section
      id="about"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="section-py bg-[--color-surface] relative overflow-hidden"
    >
      {/* Dynamic 3D Ambient Backdrop Shadow */}
      <motion.div
        style={{ x: shadowX, y: shadowY }}
        className="absolute top-1/3 right-1/4 w-[350px] h-[350px] rounded-full bg-primary/6 dark:bg-primary/3 blur-[125px] z-0 pointer-events-none select-none"
      />
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
              className="font-[family-name:var(--font-manrope)] font-extrabold text-3xl sm:text-4xl text-[--color-text-pri] leading-tight"
            >
              Digitalizing Pakistan, one transaction at a time.
            </motion.h2>

            <motion.p {...fadeUp(0.15)} className="text-lg text-[--color-text-sec] leading-relaxed font-medium">
              Pakistan’s financial future is becoming more digital, global, and asset-backed. Coinsensei is here to help users participate in this shift through a simple mobile platform designed for virtual asset access, conversion, and transfers.
            </motion.p>

            <motion.p {...fadeUp(0.2)} className="text-[--color-text-sec] leading-relaxed">
              We are building a bridge to global connectivity and stable digital value. By introducing compliant on-chain transfers and preparing for the tokenization of assets, we enable secure financial accessibility for all Pakistanis.
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
