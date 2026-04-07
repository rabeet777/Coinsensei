'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import { TRUST_BADGES, USDT_RATE, APP_LINKS } from '@/lib/constants';

function ExchangeCalculator() {
  const [usdt, setUsdt] = useState('100');

  const pkr = (() => {
    const n = parseFloat(usdt) || 0;
    return (n * USDT_RATE).toLocaleString('en-PK', { maximumFractionDigits: 0 });
  })();

  return (
    <div className="bg-white/95 p-8 rounded-[2rem] shadow-[0_22px_60px_rgba(0,104,124,0.12)] border border-[#2f4548]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-[family-name:var(--font-manrope)] font-bold text-xl text-[--color-text-pri]">
          Exchange Calculator
        </h3>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-full border border-green-200">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-[pulse-dot_2s_ease-in-out_infinite]" />
          <span className="text-xs font-bold text-green-700" style={{ fontFamily: 'var(--font-inter)' }}>
            Live Rate
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* USDT Input */}
        <div className="p-4 bg-[#eef2f4] border border-[#d6dde1] rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
          <label className="text-[10px] uppercase font-bold text-[--color-text-muted] mb-1 block" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '0.1em' }}>
            You Send
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              value={usdt}
              onChange={(e) => setUsdt(e.target.value)}
              className="flex-1 bg-transparent border-none p-0 outline-none font-[family-name:var(--font-manrope)] font-bold text-2xl text-[--color-text-pri] min-w-0"
            />
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#d6dde1] shadow-sm shrink-0">
              <span className="text-green-600 font-black text-sm">₮</span>
              <span className="font-bold text-sm text-[--color-text-pri]">USDT</span>
            </div>
          </div>
        </div>

        {/* Swap arrow */}
        <div className="flex justify-center">
          <div className="btn-primary p-2 rounded-full shadow-md border-4 border-white">
            <Icon name="arrow_downward" size={20} className="text-white" />
          </div>
        </div>

        {/* PKR Output */}
        <div className="p-4 bg-[#eef2f4] border border-[#d6dde1] rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
          <label className="text-[10px] uppercase font-bold text-[--color-text-muted] mb-1 block" style={{ fontFamily: 'var(--font-inter)', letterSpacing: '0.1em' }}>
            You Receive
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1 font-[family-name:var(--font-manrope)] font-bold text-2xl text-[--color-text-pri] min-w-0">
              {pkr}
            </div>
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#d6dde1] shadow-sm shrink-0">
              <span className="font-black text-sm text-[--color-primary]">₨</span>
              <span className="font-bold text-sm text-[--color-text-pri]">PKR</span>
            </div>
          </div>
        </div>

        {/* Rate details */}
        <div className="space-y-1 px-1">
          <div className="flex justify-between text-xs" style={{ fontFamily: 'var(--font-inter)' }}>
            <span className="text-[--color-text-muted]">Current Rate</span>
            <span className="font-bold text-[--color-text-pri]">1 USDT = {USDT_RATE.toFixed(2)} PKR</span>
          </div>
          <div className="flex justify-between text-xs" style={{ fontFamily: 'var(--font-inter)' }}>
            <span className="text-[--color-text-muted]">Service Fee</span>
            <span className="font-bold text-green-600">0% — FREE</span>
          </div>
        </div>

        {/* CTA */}
        <Button variant="primary" size="lg" href={APP_LINKS.web} className="w-full justify-center mt-2 shadow-lg">
          <Icon name="open_in_new" size={18} className="text-white" />
          Start Exchange in App
        </Button>

        <p className="text-center text-xs text-[--color-text-muted]" style={{ fontFamily: 'var(--font-inter)' }}>
          Guaranteed payment. Safe &amp; secure.
        </p>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: 'linear-gradient(92deg, #edf1f3 0%, #e8eef0 67%, #0a5755 88%, #053d3d 100%)' }}
    >
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/90 to-transparent z-10"></div>
        <img
          alt="Pakistan Landscape and Connectivity"
          className="w-full h-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAcg6M-UCHGhsKdNTJ1y0_7M-pEEusKawY0cRTkrtHd7uS_hkQjTJKyb_7Yf2vO4ddgoPaaRWL7-maqDw0oVFCykBQVu6YgGznXGrwwCIOGpo4P-1wwcMv1FnD5iYf_NDYbGETpKaVeBP_MscrKhiJqu4PIA1odkrw1lKfarOLN6op1EOKhdLoJTJp-aHMQrnq4VstqnmYE-JnVydhJ9V7ePbJLYCfUSJ2nDOM0c3c7UeIYgcAZba5ZWB4mFXi4n4U3Fr-T3x2WiAE"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-28 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
        {/* Left */}
        <div className="flex flex-col gap-7">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="badge w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-[--color-primary] animate-[pulse-dot_2s_ease-in-out_infinite]" />
              Payment Guaranteed — Always
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="font-[family-name:var(--font-manrope)] font-extrabold text-5xl md:text-6xl leading-[1.08] tracking-tight text-[--color-text-pri]"
          >
            The Trusted Way to <span className="gradient-text">Trade USDT</span> in Pakistan.
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22 }}
            className="text-lg text-[--color-text-sec] max-w-lg leading-relaxed"
          >
            No more frozen bank payments. No more scams. CoinSensei is Pakistan&apos;s most
            trusted USDT-to-PKR exchange — your money arrives, every single time.
          </motion.p>

          {/* Trust checklist */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.32 }}
            className="flex flex-wrap gap-4"
          >
            {TRUST_BADGES.map((b) => (
              <div key={b} className="flex items-center gap-2">
                <Icon name="check_circle" filled size={18} className="text-green-600 shrink-0" />
                <span className="text-sm font-semibold text-[--color-text-pri]">{b}</span>
              </div>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.42 }}
            className="flex flex-wrap gap-4"
          >
            <Button variant="primary" size="lg" href={APP_LINKS.web}>
              Sell USDT Now
              <Icon name="arrow_forward" size={20} className="text-white" />
            </Button>
            <Button variant="outline" size="lg" href="#how-it-works">
              How It Works
            </Button>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="flex flex-wrap items-center gap-6 pt-2"
          >
            {[
              { n: '5,000+', l: 'Trades Completed' },
              { n: '₨2B+',   l: 'Volume Processed'  },
              { n: '0',      l: 'Scam Reports', green: true },
            ].map((s, i) => (
              <div key={s.l} className="flex items-center gap-5">
                {i > 0 && <div className="w-px h-10 bg-[--color-border-strong]/30 hidden sm:block" />}
                <div>
                  <div className={`font-[family-name:var(--font-manrope)] font-extrabold text-2xl ${s.green ? 'text-green-600' : 'text-[--color-text-pri]'}`}>
                    {s.n}
                  </div>
                  <div className="text-xs uppercase tracking-widest text-[--color-text-muted]" style={{ fontFamily: 'var(--font-inter)' }}>
                    {s.l}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: calculator */}
        <motion.div
          initial={{ opacity: 0, x: 30, y: 14 }}
          animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
          transition={{
            opacity: { duration: 0.8, delay: 0.2 },
            x: { duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] },
            y: { duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 },
          }}
        >
          <ExchangeCalculator />
        </motion.div>
      </div>
    </section>
  );
}
