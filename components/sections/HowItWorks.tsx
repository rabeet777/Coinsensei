'use client';

import { useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';

const STEPS = [
  {
    n: 1,
    icon: 'person_add',
    title: 'Create your account',
    desc: 'Sign up and verify your profile.',
  },
  {
    n: 2,
    icon: 'account_balance',
    title: 'Deposit PKR or USDT',
    desc: 'Add funds through supported deposit methods.',
  },
  {
    n: 3,
    icon: 'currency_exchange',
    title: 'Convert with live rates',
    desc: 'Exchange PKR and USDT with transparent pricing.',
  },
  {
    n: 4,
    icon: 'payments',
    title: 'Transfer or withdraw',
    desc: 'Send USDT on-chain or withdraw PKR through supported options.',
  },
] as const;

export default function HowItWorks() {
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
      id="how-it-works"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="section-py bg-[--color-surface] relative overflow-hidden"
    >
      {/* Dynamic 3D Ambient Backdrop Shadow */}
      <motion.div
        style={{ x: shadowX, y: shadowY }}
        className="absolute top-1/3 left-1/4 w-[350px] h-[350px] rounded-full bg-primary/6 dark:bg-primary/3 blur-[125px] z-0 pointer-events-none select-none"
      />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            className="badge w-fit mx-auto mb-4"
          >
            Workflow
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ delay: 0.08 }}
            className="font-[family-name:var(--font-manrope)] font-extrabold text-2xl sm:text-3xl md:text-4xl text-[--color-text-pri] mb-4"
          >
            Start your digital asset journey in a few steps.
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ delay: 0.14 }}
            className="text-[--color-text-sec] max-w-xl mx-auto leading-relaxed"
          >
            Secure your position today to experience a modern, transparent virtual asset gateway.
          </motion.p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 relative">
          
          {/* Connector line (desktop only) */}
          <div className="hidden lg:block absolute top-8 left-[calc(12.5%+2rem)] right-[calc(12.5%+2rem)] h-px bg-[--color-border] z-0" />

          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 flex flex-col items-center text-center group cursor-default"
            >
              {/* Step number container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 8 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: false, amount: 0.15 }}
                transition={{
                  opacity: { duration: 0.35, delay: i * 0.08 },
                  scale: { duration: 0.35, delay: i * 0.08 },
                  y: { duration: 0.3 }
                }}
                className="w-16 h-16 rounded-full btn-primary text-white flex items-center justify-center font-[family-name:var(--font-manrope)] font-bold text-2xl mb-6 shadow-lg border-4 border-[--color-surface] group-hover:scale-105 transition-all duration-300"
              >
                {step.n}
              </motion.div>

              {/* Icon Container */}
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-primary/10 border border-primary/20 text-primary group-hover:scale-[1.04] group-hover:-translate-y-0.5 transition-all duration-300 icon-hover-gradient">
                <Icon name={step.icon} filled size={28} />
              </div>

              {/* Title & Desc */}
              <h4 className="font-[family-name:var(--font-manrope)] font-bold text-base text-[--color-text-pri] mb-2">
                {step.title}
              </h4>
              <p className="text-[--color-text-sec] text-xs leading-relaxed px-2">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-16"
        >
          <Button variant="primary" size="lg" href="#waitlist">
            <Icon name="mail" size={20} className="text-white" />
            Join the Waitlist Today
          </Button>
        </motion.div>

      </div>
    </section>
  );
}
