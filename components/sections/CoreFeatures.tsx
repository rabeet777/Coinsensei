'use client';

import { useRef } from 'react';
import { motion, useMotionValue, useTransform, useMotionTemplate, animate } from 'framer-motion';
import Icon from '@/components/ui/Icon';

const FEATURES = [
  {
    icon: 'swap_horiz',
    title: 'PKR ⇄ USDT Conversion',
    desc: 'Buy and sell USDT using PKR through a simple app experience.',
  },
  {
    icon: 'trending_up',
    title: 'Live Rate System',
    desc: 'View updated rates before confirming your conversion.',
  },
  {
    icon: 'lan',
    title: 'On-Chain Transfers',
    desc: 'Send and receive USDT through supported blockchain networks.',
  },
  {
    icon: 'verified_user',
    title: 'Secure Account Flow',
    desc: 'Use verification, transaction tracking, and controlled withdrawal processes.',
  },
  {
    icon: 'history',
    title: 'Transaction History',
    desc: 'Track your deposits, withdrawals, conversions, and transfers in one place.',
  },
  {
    icon: 'phone_iphone',
    title: 'Mobile-First Platform',
    desc: 'Built for a clean, fast, and easy experience on Android and iOS.',
  },
] as const;

function FeatureCard({ feature, index }: { feature: typeof FEATURES[number]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Spotlight position relative to top-left of the card
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Rotation values relative to center of the card
  const xRot = useMotionValue(0);
  const yRot = useMotionValue(0);

  // Map coordinate differences to 3D rotation angles
  const rotateX = useTransform(yRot, [-120, 120], [8, -8]);
  const rotateY = useTransform(xRot, [-120, 120], [-8, 8]);

  // Framer Motion template for the cursor tracking spotlight highlight glow
  const spotlightBg = useMotionTemplate`radial-gradient(circle 80px at ${mouseX}px ${mouseY}px, rgba(0, 216, 255, 0.15) 0%, transparent 100%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const xPos = e.clientX - rect.left;
    const yPos = e.clientY - rect.top;

    mouseX.set(xPos);
    mouseY.set(yPos);

    // Calculate position relative to card center for tilt
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    xRot.set(xPos - centerX);
    yRot.set(yPos - centerY);
  };

  const handleMouseLeave = () => {
    animate(mouseX, 0, { duration: 0.5 });
    animate(mouseY, 0, { duration: 0.5 });
    animate(xRot, 0, { duration: 0.5 });
    animate(yRot, 0, { duration: 0.5 });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.15 }}
      transition={{ delay: index * 0.06, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className="feature-card relative group p-8 bg-[--color-surface-card] border border-[--color-border] rounded-[2rem] overflow-hidden shadow-sm flex flex-col justify-between cursor-pointer select-none"
    >
      {/* 3D Moving Spotlight highlight backplate */}
      <motion.div 
        style={{ background: spotlightBg }}
        className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
      />

      <div className="relative z-10 space-y-5" style={{ transformStyle: 'preserve-3d' }}>
        {/* Icon */}
        <div 
          className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center icon-hover-gradient shrink-0 transition-transform duration-300"
          style={{ transform: 'translateZ(20px)' }}
        >
          <Icon name={feature.icon} filled size={24} className="group-hover:text-white" />
        </div>

        {/* Text Area */}
        <div className="space-y-2" style={{ transform: 'translateZ(10px)' }}>
          <h3 className="font-[family-name:var(--font-manrope)] font-bold text-lg text-[--color-text-pri] group-hover:text-primary transition-colors duration-300">
            {feature.title}
          </h3>
          <p className="text-[--color-text-sec] leading-relaxed text-sm">
            {feature.desc}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function CoreFeatures() {
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
      id="features"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="section-py bg-[--color-surface] relative overflow-hidden"
    >
      {/* Dynamic 3D Ambient Backdrop Shadow */}
      <motion.div
        style={{ x: shadowX, y: shadowY }}
        className="absolute top-1/4 left-1/3 w-[380px] h-[380px] rounded-full bg-primary/6 dark:bg-primary/3 blur-[130px] z-0 pointer-events-none select-none"
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
            Product Features
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ delay: 0.08 }}
            className="font-[family-name:var(--font-manrope)] font-extrabold text-2xl sm:text-3xl md:text-4xl text-[--color-text-pri] mb-4"
          >
            What you can do with Coinsensei
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ delay: 0.14 }}
            className="text-[--color-text-sec] max-w-xl mx-auto leading-relaxed"
          >
            A powerful suite of compliant virtual asset tools custom-tailored for the Pakistani market.
          </motion.p>
        </div>

        {/* Features Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ perspective: 1000 }}>
          {FEATURES.map((feature, i) => (
            <FeatureCard
              key={feature.title}
              feature={feature}
              index={i}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
