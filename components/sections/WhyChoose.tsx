'use client';

import { motion } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import { COMPARISON_ROWS } from '@/lib/constants';

function Cell({ value }: { value: boolean | null }) {
  if (value === true)  return <Icon name="check_circle" filled size={22} className="text-[--color-primary] mx-auto" />;
  if (value === false) return <Icon name="cancel"       filled size={22} className="text-[--color-text-muted] mx-auto" />;
  return                      <Icon name="remove_circle" filled size={22} className="text-[--color-text-muted] mx-auto" />;
}

export default function WhyChoose() {
  return (
    <section id="why-us" className="section-py bg-[--color-surface-mid]">
      <div className="max-w-7xl mx-auto px-6">
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
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ delay: 0.1 }}
          className="bg-[--color-surface-card] rounded-[2rem] border border-[--color-border] overflow-hidden shadow-sm mb-10"
        >
          {/* Table header */}
          <div className="grid grid-cols-4 bg-[--color-surface-mid] px-6 py-4 text-center text-xs font-bold uppercase tracking-widest text-[--color-text-muted]" style={{ fontFamily: 'var(--font-inter)' }}>
            <div className="text-left">Feature</div>
            <div className="text-[--color-primary] font-extrabold text-sm">CoinSensei</div>
            <div>P2P Platforms</div>
            <div>OTC Dealers</div>
          </div>

          <div className="divide-y divide-[--color-border]">
            {COMPARISON_ROWS.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-4 px-6 py-4 items-center text-center text-sm ${i % 2 === 1 ? 'bg-[--color-surface]/50' : ''}`}
              >
                <div className="text-left font-semibold text-[--color-text-pri]">{row.feature}</div>
                <div><Cell value={row.cs}  /></div>
                <div><Cell value={row.p2p} /></div>
                <div><Cell value={row.otc} /></div>
              </div>
            ))}
          </div>
        </motion.div>

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
