'use client';

import { useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import { COMPARISON_ROWS } from '@/lib/constants';

const FEATURE_DESCRIPTIONS: Record<string, string> = {
  'On-Chain Asset Access': 'Hold and transfer assets directly on public blockchains',
  'No Bank Hold/Freeze Risks': 'Avoid third-party P2P bank account restrictions',
  'Regulated Custody Gateway': 'Audited framework under SECP guidelines',
  'Urdu Live Support': '24/7 dedicated in-app support in Urdu & English',
  'Direct PKR Settlements': 'Instant bank transfers without intermediary risk',
  'Tokenized Finance Access': 'Fractional ownership of future digital assets',
};

function Cell({ value, isCS = false }: { value: boolean | null; isCS?: boolean }) {
  if (value === true) {
    return (
      <div className={`w-9 h-9 rounded-full flex items-center justify-center mx-auto transition-transform duration-300 hover:scale-110 shadow-sm ${
        isCS 
          ? 'bg-gradient-to-br from-primary/20 to-primary/45 border border-primary/30 text-primary shadow-[0_0_12px_rgba(0,216,255,0.25)]' 
          : 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/25 border border-emerald-500/20 text-emerald-400'
      }`}>
        <Icon name="done" size={18} className="font-black" />
      </div>
    );
  }
  if (value === false) {
    return (
      <div className="w-9 h-9 rounded-full bg-rose-500/10 border border-rose-500/35 text-rose-400 flex items-center justify-center mx-auto transition-transform duration-300 hover:scale-110">
        <Icon name="close" size={16} className="font-bold" />
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-300 flex items-center justify-center mx-auto transition-transform duration-300 hover:scale-110">
      <Icon name="remove" size={16} className="font-bold" />
    </div>
  );
}

export default function WhyChoose() {
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
      id="why-us"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="section-py bg-[--color-surface-mid] relative overflow-hidden"
    >
      {/* Dynamic 3D Ambient Backdrop Shadow */}
      <motion.div
        style={{ x: shadowX, y: shadowY }}
        className="absolute top-1/4 right-1/3 w-[360px] h-[360px] rounded-full bg-primary/6 dark:bg-primary/3 blur-[130px] z-0 pointer-events-none select-none"
      />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            className="badge w-fit mx-auto mb-4"
          >
            Why CoinSensei
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ delay: 0.08 }}
            className="font-[family-name:var(--font-manrope)] font-extrabold text-4xl text-[--color-text-pri] mb-4"
          >
            The Safest Choice in Pakistan
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ delay: 0.14 }}
            className="text-[--color-text-sec] max-w-xl mx-auto leading-relaxed"
          >
            See how CoinSensei compares to the alternatives Pakistani virtual asset users currently use.
          </motion.p>
        </div>

        {/* Comparison Table */}
        <div className="relative mb-14">
          {/* Swipe indicator (visible on mobile only) */}
          <div className="md:hidden flex items-center justify-end gap-1.5 text-xs text-[--color-text-muted] font-semibold uppercase tracking-wider mb-2 select-none">
            Swipe to view
            <Icon name="arrow_forward" size={14} className="animate-pulse" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ delay: 0.1, duration: 0.65 }}
            className="overflow-x-auto rounded-[2rem] shadow-[0_24px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_24px_50px_rgba(0,216,255,0.03)] bg-gradient-to-b from-[--color-surface-card] to-[--color-surface-mid]/90 backdrop-blur-md"
          >
            <div className="min-w-[768px]">
              {/* Table header */}
              <div 
                className="grid grid-cols-[2fr_1.2fr_1fr_1fr] bg-[--color-surface-mid]/50 px-8 py-6 text-center text-xs font-bold uppercase tracking-widest text-[--color-text-muted] items-center" 
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                <div className="text-left">Feature</div>
                <div className="text-primary font-black text-sm flex flex-col items-center justify-center relative py-1.5 bg-primary/5 rounded-t-2xl">
                  <span className="absolute -top-3.5 px-3 py-0.5 rounded-full text-[9px] uppercase tracking-wider bg-gradient-to-r from-primary to-primary-light text-black font-extrabold shadow-[0_0_12px_rgba(0,216,255,0.3)] scale-90 select-none">
                    Recommended
                  </span>
                  CoinSensei
                </div>
                <div>P2P Platforms</div>
                <div>OTC Dealers</div>
              </div>

              {/* Table body */}
              <div className="relative">
                {COMPARISON_ROWS.map((row, i) => {
                  const isLast = i === COMPARISON_ROWS.length - 1;
                  return (
                    <div
                      key={row.feature}
                      className={`grid grid-cols-[2fr_1.2fr_1fr_1fr] px-8 items-center text-center text-sm transition-all duration-200 group/row hover:bg-white/[0.015] ${
                        i % 2 === 1 ? 'bg-white/[0.006]' : ''
                      }`}
                    >
                      <div className="text-left py-5 pr-4">
                        <div className="font-bold text-[--color-text-pri] mb-0.5 group-hover/row:text-primary transition-colors duration-150">{row.feature}</div>
                        <div className="text-xs text-[--color-text-muted] font-medium leading-normal">{FEATURE_DESCRIPTIONS[row.feature]}</div>
                      </div>
                      <div className={`bg-primary/[0.025] dark:bg-primary/[0.015] py-5 h-full flex items-center justify-center ${isLast ? 'rounded-b-2xl' : ''}`}>
                        <Cell value={row.cs} isCS />
                      </div>
                      <div className="py-5 h-full flex items-center justify-center"><Cell value={row.p2p} /></div>
                      <div className="py-5 h-full flex items-center justify-center"><Cell value={row.otc} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            className="feature-card p-8"
          >
            <h4 className="font-[family-name:var(--font-manrope)] font-bold text-xl text-[--color-text-pri] mb-4 flex items-center gap-2">
              <Icon name="public" filled size={22} className="text-[--color-primary]" />
              Pakistan-First Approach
            </h4>
            <p className="text-[--color-text-sec] leading-relaxed text-sm">
              We understand Pakistan&apos;s banking system, regulatory landscape, and the trust
              issues local crypto traders face daily. Our entire service is designed around your
              needs — PKR settlement, local bank support, and Urdu assistance inside the app.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            className="feature-card p-8"
          >
            <h4 className="font-[family-name:var(--font-manrope)] font-bold text-xl text-[--color-text-pri] mb-4 flex items-center gap-2">
              <Icon name="handshake" filled size={22} className="text-[--color-primary]" />
              Built on Accountability
            </h4>
            <p className="text-[--color-text-sec] leading-relaxed text-sm">
              Every transaction has a record. We stand behind every trade with our business
              reputation on the line. If anything goes wrong, we make it right — period. That
              is the CoinSensei guarantee.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
