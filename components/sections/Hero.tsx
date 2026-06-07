'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import { TRUST_BADGES, APP_LINKS } from '@/lib/constants';

function AppShowcase() {
  return (
    <div 
      className="relative h-[420px] sm:h-[520px] w-full max-w-[340px] mx-auto flex items-center justify-center select-none"
      style={{ perspective: 1000 }}
    >
      {/* Decorative radial card glow */}
      <div className="absolute inset-0 bg-primary/15 rounded-full blur-3xl z-0 pointer-events-none" />

      {/* Centered Phone Container */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.92, rotate: -2 }}
        animate={{ 
          opacity: 1, 
          y: [0, -16, 0], 
          scale: 1,
          rotate: -2
        }}
        whileHover={{
          scale: 1.06,
          rotateY: -12,
          rotateX: 8,
          z: 30,
          transition: { duration: 0.4, ease: 'easeOut' }
        }}
        transition={{
          opacity: { duration: 0.8, delay: 0.2 },
          scale: { duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] },
          y: { 
            duration: 6, 
            repeat: Infinity, 
            ease: 'easeInOut'
          }
        }}
        className="relative z-10 w-[240px] sm:w-[280px] filter drop-shadow-[0_25px_50px_rgba(0,0,0,0.22)] dark:drop-shadow-[0_25px_50px_rgba(0,216,255,0.14)] cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <img 
          src="/mobileImage1.png" 
          alt="CoinSensei App Screen Mockup" 
          className="w-full h-auto object-contain" 
          loading="eager"
        />
      </motion.div>
    </div>
  );
}

export default function Hero() {
  const [liveRate, setLiveRate] = useState(297.45);
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);

    const rateInterval = setInterval(() => {
      setLiveRate((prev) => {
        const delta = (Math.random() - 0.5) * 0.12;
        const nextRate = prev + delta;
        return Math.max(297.10, Math.min(297.90, nextRate));
      });
      setSecondsAgo(0);
    }, 15000);

    return () => {
      clearInterval(timer);
      clearInterval(rateInterval);
    };
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: 'var(--hero-bg)' }}
    >
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/90 to-transparent z-10"></div>
        <img
          alt="Pakistan Landscape Map"
          className="w-full h-full object-cover"
          style={{ filter: 'var(--hero-img-filter)', opacity: 'var(--hero-img-opacity)' }}
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAcg6M-UCHGhsKdNTJ1y0_7M-pEEusKawY0cRTkrtHd7uS_hkQjTJKyb_7Yf2vO4ddgoPaaRWL7-maqDw0oVFCykBQVu6YgGznXGrwwCIOGpo4P-1wwcMv1FnD5iYf_NDYbGETpKaVeBP_MscrKhiJqu4PIA1odkrw1lKfarOLN6op1EOKhdLoJTJp-aHMQrnq4VstqnmYE-JnVydhJ9V7ePbJLYCfUSJ2nDOM0c3c7UeIYgcAZba5ZWB4mFXi4n4U3Fr-T3x2WiAE"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-28 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
        {/* Left Content */}
        <div className="flex flex-col gap-7">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="badge w-fit select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-[pulse-dot_2s_ease-in-out_infinite]" />
              Pakistan ka apna crypto platform
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="font-[family-name:var(--font-manrope)] font-extrabold text-5xl md:text-6xl leading-[1.08] tracking-tight text-[--color-text-pri]"
          >
            Convert PKR to USDT <span className="gradient-text">safely</span> — no bank freezes, no scams
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22 }}
            className="text-lg text-[--color-text-sec] max-w-lg leading-relaxed"
          >
            Pakistan's first crypto platform built for peace of mind. Buy, sell, and transfer crypto assets with zero hassle, transparent live rates, and complete protection.
          </motion.p>

          {/* Live Rate Ticker */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className="flex items-center gap-3 bg-white/[0.03] dark:bg-white/[0.015] border border-white/10 dark:border-white/5 px-4 py-2 rounded-2xl w-fit shadow-md select-none"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-[pulse-dot_1.5s_infinite]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[--color-text-muted]" style={{ fontFamily: 'var(--font-inter)' }}>Live Rate</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-bold text-[--color-text-sec]" style={{ fontFamily: 'var(--font-manrope)' }}>1 USDT ≈</span>
              <span className="text-base font-black text-primary" style={{ fontFamily: 'var(--font-manrope)' }}>{liveRate.toFixed(2)} PKR</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <span className="text-[9px] font-medium text-[--color-text-muted]">Updated {secondsAgo}s ago</span>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.32 }}
            className="flex flex-wrap gap-4"
          >
            {TRUST_BADGES.map((b) => (
              <div key={b} className="flex items-center gap-2 select-none">
                <Icon name="check_circle" filled size={18} className="text-primary shrink-0" />
                <span className="text-sm font-semibold text-[--color-text-pri]">{b}</span>
              </div>
            ))}
          </motion.div>

          {/* Waitlist Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.42 }}
            className="flex flex-wrap gap-4"
          >
            <Button variant="primary" size="lg" href="#waitlist">
              Join the Waitlist
              <Icon name="mail" size={20} className="text-white" />
            </Button>
            <Button variant="outline" size="lg" href="#features">
              Explore Coinsensei
            </Button>
          </motion.div>

          {/* Mobile Wallets Prominent Callout */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.48 }}
            className="flex items-center gap-3.5 bg-primary/5 border border-primary/20 p-4 rounded-2xl max-w-lg shadow-sm backdrop-blur-md"
          >
            <div className="flex gap-2 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-sm">
                <img src="/bank-logos/easypaisa.png" alt="Easypaisa" className="w-full h-full object-contain" />
              </div>
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-sm">
                <img src="/bank-logos/jazzcash.png" alt="JazzCash" className="w-full h-full object-contain" />
              </div>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold text-[--color-text-pri]" style={{ fontFamily: 'var(--font-manrope)' }}>
                Works with JazzCash & Easypaisa
              </span>
              <span className="text-xs text-[--color-text-sec]">
                No traditional bank account needed for immediate PKR settlement.
              </span>
            </div>
          </motion.div>

          {/* Trust Launch Line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.52 }}
            className="text-xs text-[--color-text-muted] font-semibold tracking-wide uppercase"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            Launching soon on Android and iOS.
          </motion.p>
        </div>

        {/* Right: App Preview Mockup Overlays */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <AppShowcase />
        </motion.div>
      </div>
    </section>
  );
}
