'use client';

import { motion } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import { SECURITY_FEATURES } from '@/lib/constants';

const CHECKLIST = [
  'Payment Guaranteed',
  'Zero Scam Reports — Ever',
  '5,000+ Verified Trades',
  'No Bank Holds — Ever',
  'Registered Business Identity',
];

export default function SecuritySection() {
  return (
    <section
      id="security"
      className="section-py text-white overflow-hidden relative"
      style={{ background: 'linear-gradient(135deg, #00687c 0%, #005468 100%)' }}
    >
      {/* Decorative blobs */}
      <div className="absolute right-0 top-0 w-1/2 h-full opacity-10 pointer-events-none">
        <svg className="w-full h-full" fill="currentColor" viewBox="0 0 100 100">
          <circle cx="100" cy="0" r="100" />
        </svg>
      </div>
      <div className="absolute left-0 bottom-0 w-64 h-64 opacity-5 pointer-events-none">
        <svg className="w-full h-full" fill="currentColor" viewBox="0 0 100 100">
          <circle cx="0" cy="100" r="100" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left: Content */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1 rounded-full bg-white/10 text-white font-bold uppercase tracking-widest text-xs mb-6"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            Your Protection is Our Priority
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="font-[family-name:var(--font-manrope)] font-extrabold text-4xl leading-tight mb-10"
          >
            Built on Trust.<br />Backed by Guarantees.
          </motion.h2>

          <div className="space-y-7">
            {SECURITY_FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Icon name={f.icon} filled size={24} className="text-white" />
                </div>
                <div>
                  <h4 className="font-[family-name:var(--font-manrope)] font-bold text-lg mb-1">
                    {f.title}
                  </h4>
                  <p className="text-white/70 leading-relaxed text-sm">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right: Checklist card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="flex justify-center"
        >
          <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 text-center space-y-5 w-full max-w-sm">
            <Icon name="shield_with_heart" filled size={96} className="text-white/25 mx-auto" />
            <div className="space-y-3">
              {CHECKLIST.map((item) => (
                <div key={item} className="flex items-center gap-3 bg-white/10 px-5 py-3 rounded-xl">
                  <Icon name="check_circle" filled size={20} className="text-green-400 shrink-0" />
                  <span className="font-semibold text-sm text-left">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
