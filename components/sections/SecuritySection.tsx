'use client';

import { motion } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import { SECURITY_FEATURES } from '@/lib/constants';

const CHECKLIST = [
  'Regulated Cold Custody',
  'Audit-Trail On-Chain Logs',
  'Direct PKR Settlement',
  'Multi-Sig Security Checks',
  'Corporate Gateway Identity',
];

export default function SecuritySection() {
  return (
    <section
      id="security"
      className="section-py text-[--color-text-pri] bg-gradient-to-br from-[--color-surface-mid] to-[--color-surface] overflow-hidden relative"
    >
      {/* Decorative blobs */}
      <div className="absolute right-0 top-0 w-1/2 h-full opacity-5 pointer-events-none text-[--color-primary]">
        <svg className="w-full h-full" fill="currentColor" viewBox="0 0 100 100">
          <circle cx="100" cy="0" r="100" />
        </svg>
      </div>
      <div className="absolute left-0 bottom-0 w-64 h-64 opacity-5 pointer-events-none text-[--color-primary]">
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
            viewport={{ once: false, amount: 0.15 }}
            className="badge mb-6"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            Your Protection is Our Priority
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ delay: 0.08 }}
            className="font-[family-name:var(--font-manrope)] font-extrabold text-4xl leading-tight mb-10 text-[--color-text-pri]"
          >
            Built on Trust.<br />Backed by Guarantees.
          </motion.h2>

          <div className="space-y-7">
            {SECURITY_FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.15 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4 group cursor-default"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 icon-hover-gradient">
                  <Icon name={f.icon} filled size={24} className="text-primary group-hover:text-white transition-colors duration-300" />
                </div>
                <div>
                  <h4 className="font-[family-name:var(--font-manrope)] font-bold text-lg mb-1 text-[--color-text-pri] group-hover:text-primary transition-colors duration-350">
                    {f.title}
                  </h4>
                  <p className="text-[--color-text-sec] leading-relaxed text-sm">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right: Security App Mockup */}
        <div 
          className="flex justify-center select-none w-full max-w-[340px] mx-auto relative"
          style={{ perspective: 1000 }}
        >
          {/* Radial card glow */}
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl z-0 pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.92, rotate: 2 }}
            whileInView={{ 
              opacity: 1, 
              y: [0, -16, 0], 
              scale: 1,
              rotate: 2
            }}
            whileHover={{
              scale: 1.06,
              rotateY: 12,
              rotateX: 8,
              z: 30,
              transition: { duration: 0.4, ease: 'easeOut' }
            }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{
              opacity: { duration: 0.8, delay: 0.2 },
              scale: { duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] },
              y: { 
                duration: 6, 
                repeat: Infinity, 
                ease: 'easeInOut'
              }
            }}
            className="relative z-10 w-[240px] sm:w-[280px] filter drop-shadow-[0_25px_50px_rgba(0,0,0,0.4)] cursor-pointer"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <img 
              src="/mobileimage2.png" 
              alt="CoinSensei Security App Mockup" 
              className="w-full h-auto object-contain" 
              loading="lazy"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
