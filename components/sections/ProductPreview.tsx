'use client';

import { motion } from 'framer-motion';
import { STATS, TESTIMONIALS } from '@/lib/constants';

export default function ProductPreview() {
  return (
    <section className="section-py bg-[--color-surface]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            className="badge w-fit mx-auto mb-4"
          >
            Proven Track Record
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ delay: 0.08 }}
            className="font-[family-name:var(--font-manrope)] font-extrabold text-4xl text-[--color-text-pri]"
          >
            Numbers That Speak for Themselves
          </motion.h2>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-20">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ delay: i * 0.08 }}
              className="feature-card text-center p-8 bg-[--color-surface-mid]"
            >
              <div className="font-[family-name:var(--font-manrope)] font-extrabold text-4xl mb-2 text-[--color-primary]">
                {s.value}
              </div>
              <div className="text-xs uppercase tracking-widest text-[--color-text-muted]" style={{ fontFamily: 'var(--font-inter)' }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ delay: i * 0.1, duration: 0.55 }}
              className="feature-card p-8 flex flex-col"
            >
              <div className="text-[--color-primary] text-lg mb-4 tracking-widest">★★★★★</div>
              <p className="text-[--color-text-sec] leading-relaxed mb-6 flex-1 text-sm italic">
                {t.quote}
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-[--color-border]">
                <div className="w-10 h-10 rounded-full bg-[--color-primary]/15 flex items-center justify-center font-bold text-[--color-primary] shrink-0 text-sm">
                  {t.initials}
                </div>
                <div>
                  <div className="font-[family-name:var(--font-manrope)] font-bold text-sm text-[--color-text-pri]">
                    {t.name}
                  </div>
                  <div className="text-xs text-[--color-text-muted]" style={{ fontFamily: 'var(--font-inter)' }}>
                    {t.city}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
