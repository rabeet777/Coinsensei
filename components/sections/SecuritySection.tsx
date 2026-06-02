'use client';

import { useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import Icon from '@/components/ui/Icon';

const SECURITY_POINTS = [
  {
    icon: 'shield_person',
    title: 'Secure Account Access',
    desc: 'Profile verification and login controls designed with account protection in mind.',
  },
  {
    icon: 'lock_person',
    title: 'Monitored Withdrawals',
    desc: 'Controlled transfer procedures designed to support a safer withdrawal flow.',
  },
  {
    icon: 'history_toggle_off',
    title: 'Transaction History',
    desc: 'Comprehensive record-keeping providing transparent tracking of conversions.',
  },
  {
    icon: 'vpn_lock',
    title: 'Safer Verification Flows',
    desc: 'Structured identity checks built to support community safety and prevent fraud.',
  },
] as const;

export default function SecuritySection() {
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
      id="security"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="section-py text-[--color-text-pri] bg-gradient-to-br from-[--color-surface-mid] to-[--color-surface] border-y border-[--color-border] overflow-hidden relative"
    >
      {/* Dynamic 3D Ambient Backdrop Shadow */}
      <motion.div
        style={{ x: shadowX, y: shadowY }}
        className="absolute top-1/3 right-1/4 w-[350px] h-[350px] rounded-full bg-primary/6 dark:bg-primary/3 blur-[125px] z-0 pointer-events-none select-none"
      />
      {/* Decorative background vectors */}
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

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
        
        {/* Left: Compliant Copy + Checklist */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            className="badge mb-6"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            Compliance & Transparency
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ delay: 0.08 }}
            className="font-[family-name:var(--font-manrope)] font-extrabold text-2xl sm:text-3xl md:text-4xl leading-tight mb-6 text-[--color-text-pri]"
          >
            Designed with security and transparency at the core.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ delay: 0.12 }}
            className="text-sm text-[--color-text-sec] leading-relaxed mb-10 max-w-xl font-medium"
          >
            Coinsensei is being developed with secure account access, verification flows, transaction history, and monitored withdrawals to support a safer digital asset experience.
          </motion.p>

          <div className="space-y-7">
            {SECURITY_POINTS.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.15 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4 group cursor-default"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:scale-[1.04] group-hover:-translate-y-0.5 transition-all duration-300 icon-hover-gradient">
                  <Icon name={f.icon} filled size={24} className="text-primary group-hover:text-white transition-colors duration-300" />
                </div>
                <div>
                  <h4 className="font-[family-name:var(--font-manrope)] font-bold text-base mb-1 text-[--color-text-pri] group-hover:text-primary transition-colors duration-350">
                    {f.title}
                  </h4>
                  <p className="text-[--color-text-sec] leading-relaxed text-xs max-w-lg">{f.desc}</p>
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
            initial={{ opacity: 0, y: 12, scale: 0.97, rotate: 2 }}
            whileInView={{ 
              opacity: 1, 
              y: [0, -8, 0], 
              scale: 1,
              rotate: 2
            }}
            whileHover={{
              scale: 1.02,
              rotateY: 4,
              rotateX: 3,
              z: 10,
              transition: { duration: 0.4, ease: 'easeOut' }
            }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{
              opacity: { duration: 0.8, delay: 0.2 },
              scale: { duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] },
              y: { 
                duration: 7, 
                repeat: Infinity, 
                ease: 'easeInOut'
              }
            }}
            className="relative z-10 w-[240px] sm:w-[280px] filter drop-shadow-[0_25px_50px_rgba(0,0,0,0.22)] dark:drop-shadow-[0_25px_50px_rgba(0,216,255,0.14)] cursor-pointer"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <img 
              src="/mobileimage2.png" 
              alt="CoinSensei Security App Mockup" 
              className="w-full h-auto object-cover" 
              loading="lazy"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
