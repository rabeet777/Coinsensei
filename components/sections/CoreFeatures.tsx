'use client';

import { motion } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import { FEATURES } from '@/lib/constants';

export default function CoreFeatures() {
  return (
    <section id="features" className="section-py bg-[--color-surface]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            className="badge w-fit mx-auto mb-4"
          >
            Core Features
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ delay: 0.08 }}
            className="font-[family-name:var(--font-manrope)] font-extrabold text-4xl text-[--color-text-pri] mb-4"
          >
            Everything You Need. Nothing You Don&apos;t.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ delay: 0.14 }}
            className="text-[--color-text-sec] max-w-xl mx-auto leading-relaxed"
          >
            Built specifically to solve the problems Pakistani crypto users face every day.
          </motion.p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ delay: i * 0.07, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="feature-card group p-8"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-primary/10 border border-primary/20 text-primary group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 icon-hover-gradient">
                <Icon name={f.icon} filled size={28} />
              </div>
              <h3 className="font-[family-name:var(--font-manrope)] font-bold text-xl text-[--color-text-pri] mb-3">
                {f.title}
              </h3>
              <p className="text-[--color-text-sec] leading-relaxed text-sm">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
