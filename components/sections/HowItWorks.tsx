'use client';

import { motion } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import { STEPS, APP_LINKS } from '@/lib/constants';

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section-py bg-[--color-surface]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            className="badge w-fit mx-auto mb-4"
          >
            How It Works
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ delay: 0.08 }}
            className="font-[family-name:var(--font-manrope)] font-extrabold text-4xl text-[--color-text-pri] mb-4"
          >
            Access Virtual Assets in 3 Simple Steps
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ delay: 0.14 }}
            className="text-[--color-text-sec] max-w-xl mx-auto"
          >
            Secure your position today to experience compliant, secure digital asset access.
          </motion.p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-8 left-[calc(16.67%+2.5rem)] right-[calc(16.67%+2.5rem)] h-px bg-[--color-border] z-0" />

          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 flex flex-col items-center text-center group cursor-default"
            >
              {/* Step number */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 8 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: false, amount: 0.15 }}
                animate={i < 2 ? { y: [0, -6, 0] } : { y: 0 }}
                transition={{
                  opacity: { duration: 0.35, delay: i * 0.1 },
                  scale: { duration: 0.35, delay: i * 0.1 },
                  y: i < 2
                    ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.8 + i * 0.15 }
                    : { duration: 0.3 },
                }}
                className="w-16 h-16 rounded-full btn-primary text-white flex items-center justify-center font-[family-name:var(--font-manrope)] font-bold text-2xl mb-6 shadow-lg border-4 border-[--color-surface] group-hover:scale-105 transition-all duration-300"
              >
                {step.n}
              </motion.div>

              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-primary/10 border border-primary/20 text-primary group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 icon-hover-gradient">
                <Icon name={step.icon} filled size={28} />
              </div>

              <h4 className="font-[family-name:var(--font-manrope)] font-bold text-xl text-[--color-text-pri] mb-3">
                {step.title}
              </h4>
              <p className="text-[--color-text-sec] text-sm leading-relaxed px-4">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
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
