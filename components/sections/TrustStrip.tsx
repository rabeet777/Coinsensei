'use client';

import { motion } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import { TRUST_ITEMS } from '@/lib/constants';

export default function TrustStrip() {
  return (
    <div className="bg-[--color-surface-mid] border-y border-[--color-border] py-6 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {TRUST_ITEMS.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: 'easeOut' }}
              whileHover={{ y: -3 }}
              className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 group cursor-default"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[--color-primary]/10 border border-[--color-primary]/20 text-[--color-primary] icon-hover-gradient group-hover:scale-[1.04] transition-all duration-300">
                <Icon name={item.icon} filled size={20} className="group-hover:text-white transition-colors duration-300" />
              </div>
              <div>
                <div className="font-[family-name:var(--font-manrope)] font-bold text-sm text-[--color-text-pri] leading-tight group-hover:text-primary transition-colors duration-300">
                  {item.title}
                </div>
                <div className="text-xs text-[--color-text-muted]" style={{ fontFamily: 'var(--font-inter)' }}>
                  {item.sub}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
