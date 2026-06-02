'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import ParticlesBackground from '@/components/ui/ParticlesBackground';

export default function FinalCTA() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

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
      id="waitlist"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="py-24 scroll-mt-24 relative overflow-hidden"
    >
      {/* Dynamic 3D Ambient Backdrop Shadow */}
      <motion.div
        style={{ x: shadowX, y: shadowY }}
        className="absolute top-1/3 left-1/3 w-[380px] h-[380px] rounded-full bg-primary/6 dark:bg-primary/3 blur-[130px] z-0 pointer-events-none select-none"
      />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div
          className="rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden text-[--color-text-pri] border border-[--color-border] bg-gradient-to-br from-[--color-surface-mid] to-[--color-surface-high] shadow-sm"
        >
          {/* Background lines */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d="M0 100 C 20 0 50 0 100 100"  fill="none" stroke="currentColor" strokeWidth="0.5" className="text-[--color-border-strong]" />
              <path d="M0 80 C 30 10 70 10 100 80"  fill="none" stroke="currentColor" strokeWidth="0.5" className="text-[--color-border-strong]" />
              <path d="M0 60 C 40 20 60 20 100 60"  fill="none" stroke="currentColor" strokeWidth="0.5" className="text-[--color-border-strong]" />
            </svg>
          </div>
          <ParticlesBackground quantity={45} className="opacity-30" />
 
          <div className="relative z-10 space-y-8 max-w-2xl mx-auto">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              className="badge select-none"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              <span className="w-2 h-2 rounded-full bg-primary inline-block animate-[pulse-dot_2s_ease-in-out_infinite]" />
              Waitlist Live
            </motion.div>
 
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ delay: 0.1, duration: 0.7 }}
              className="font-[family-name:var(--font-manrope)] font-extrabold text-3xl sm:text-4xl md:text-5xl leading-tight text-[--color-text-pri]"
            >
              Be part of Pakistan’s digital asset future.
            </motion.h2>
 
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ delay: 0.18 }}
              className="text-[--color-text-sec] text-base sm:text-lg leading-relaxed"
            >
              Join the Coinsensei waitlist and get early updates before launch.
            </motion.p>
 
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.form
                  key="waitlist-form"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleSubmit}
                  className="flex flex-col sm:flex-row gap-3 pt-4 max-w-md mx-auto"
                >
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="flex-1 bg-[--input-bg] text-[--color-text-pri] border border-[--input-border] rounded-xl px-5 py-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all select-all"
                  />
                  <button
                    type="submit"
                    className="btn-primary px-8 py-4 rounded-xl font-bold text-base shadow-lg transition-transform active:scale-97 cursor-pointer whitespace-nowrap shrink-0 flex items-center justify-center gap-2"
                  >
                    Join Waitlist
                    <Icon name="mail" size={20} className="text-white" />
                  </button>
                </motion.form>
              ) : (
                <motion.div
                  key="waitlist-success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                  className="p-8 rounded-2xl border border-primary/20 bg-primary/5 text-center space-y-3 max-w-md mx-auto"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                    <Icon name="check_circle" filled size={26} className="text-primary" />
                  </div>
                  <h4 className="font-bold text-lg text-[--color-text-pri]">You are on the list!</h4>
                  <p className="text-sm text-[--color-text-sec] leading-relaxed">
                    Thank you for registering. You are <span className="text-primary font-bold">#12,841</span> in line. We will email you your early invite codes soon.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
 
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ delay: 0.4 }}
              className="text-[--color-text-muted] text-xs font-semibold"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              Launching soon on Android and iOS. Your privacy is fully protected.
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
}
