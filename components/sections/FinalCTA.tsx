'use client';

import { motion } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import { APP_LINKS } from '@/lib/constants';

export default function FinalCTA() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div
          className="rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden text-white"
          style={{ background: 'linear-gradient(135deg, #00687c 0%, #18d8ff 100%)' }}
        >
          {/* Background lines */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d="M0 100 C 20 0 50 0 100 100"  fill="none" stroke="white" strokeWidth="0.5" />
              <path d="M0 80 C 30 10 70 10 100 80"  fill="none" stroke="white" strokeWidth="0.5" />
              <path d="M0 60 C 40 20 60 20 100 60"  fill="none" stroke="white" strokeWidth="0.5" />
            </svg>
          </div>

          <div className="relative z-10 space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 rounded-full text-white font-bold uppercase tracking-widest text-xs"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-[pulse-dot_2s_ease-in-out_infinite]" />
              Available Now — Start in Minutes
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.7 }}
              className="font-[family-name:var(--font-manrope)] font-extrabold text-4xl md:text-5xl leading-tight"
            >
              Stop Risking Your Crypto.<br />
              Start Trading with Certainty.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.18 }}
              className="text-white/80 text-lg max-w-xl mx-auto leading-relaxed"
            >
              Join 5,000+ Pakistani traders who sell USDT safely and reliably.
              Guaranteed payment. Zero scam risk. All in one app.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.26 }}
              className="flex flex-col md:flex-row items-center justify-center gap-4 pt-2"
            >
              {/* App Store */}
              <a
                href={APP_LINKS.ios}
                className="flex items-center gap-3 bg-white text-[--color-text-pri] px-8 py-4 rounded-xl font-bold text-base shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5 active:scale-97"
              >
                <Icon name="phone_iphone" filled size={22} className="text-[--color-text-pri]" />
                <div className="text-left">
                  <div className="text-[10px] uppercase tracking-widest opacity-50 leading-none mb-0.5" style={{ fontFamily: 'var(--font-inter)' }}>
                    Download on
                  </div>
                  <div className="text-sm font-bold leading-none">App Store</div>
                </div>
              </a>

              {/* Google Play */}
              <a
                href={APP_LINKS.android}
                className="flex items-center gap-3 bg-white text-[--color-text-pri] px-8 py-4 rounded-xl font-bold text-base shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5 active:scale-97"
              >
                <Icon name="android" filled size={22} className="text-[--color-text-pri]" />
                <div className="text-left">
                  <div className="text-[10px] uppercase tracking-widest opacity-50 leading-none mb-0.5" style={{ fontFamily: 'var(--font-inter)' }}>
                    Get it on
                  </div>
                  <div className="text-sm font-bold leading-none">Google Play</div>
                </div>
              </a>

              {/* Web App */}
              <a
                href={APP_LINKS.web}
                className="flex items-center gap-3 bg-white/15 text-white border border-white/30 px-8 py-4 rounded-xl font-bold text-base backdrop-blur hover:bg-white/25 transition-all active:scale-97"
              >
                <Icon name="open_in_new" size={20} className="text-white" />
                Open Web App
              </a>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-white/50 text-sm"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              Guaranteed payment on every trade. Start immediately.
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
}
