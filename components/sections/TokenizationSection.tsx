'use client';

import { useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import Icon from '@/components/ui/Icon';

const CARDS = [
  {
    icon: 'generating_tokens',
    title: 'Virtual Assets',
    desc: 'Access digital assets through a simpler and more guided experience.',
  },
  {
    icon: 'corporate_fare',
    title: 'Tokenized Finance',
    desc: 'Be ready for a future where assets, value, and ownership can move digitally.',
  },
  {
    icon: 'hub',
    title: 'On-Chain Movement',
    desc: 'Send and receive value through supported blockchain networks.',
  },
  {
    icon: 'currency_exchange',
    title: 'Local Currency Access',
    desc: 'Move between PKR and digital assets with clear and transparent flows.',
  },
] as const;

export default function TokenizationSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Motion values for high performance mouse tracking (no re-renders)
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Map mouse positions to 3D rotation angles
  const rotateX = useTransform(y, [-200, 200], [15, -15]);
  const rotateY = useTransform(x, [-200, 200], [-15, 15]);
  
  // Map mouse positions to shadow translation in the OPPOSITE direction (dynamic light casting)
  const shadowX = useTransform(x, [-200, 200], [25, -25]);
  const shadowY = useTransform(y, [-200, 200], [25, -25]);

  // Handle cursor movement inside the container
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Coordinates relative to center
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    x.set(mouseX);
    y.set(mouseY);
  };

  // Reset rotation and shadow on cursor exit
  const handleMouseLeave = () => {
    animate(x, 0, { duration: 0.6, ease: 'easeOut' });
    animate(y, 0, { duration: 0.6, ease: 'easeOut' });
  };

  const sectionRef = useRef<HTMLDivElement>(null);
  const sectionMouseX = useMotionValue(0);
  const sectionMouseY = useMotionValue(0);
  
  const sectionShadowX = useTransform(sectionMouseX, [-500, 500], [25, -25]);
  const sectionShadowY = useTransform(sectionMouseY, [-500, 500], [25, -25]);

  const handleSectionMouseMove = (e: React.MouseEvent) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const xVal = e.clientX - rect.left - rect.width / 2;
    const yVal = e.clientY - rect.top - rect.height / 2;
    sectionMouseX.set(xVal);
    sectionMouseY.set(yVal);
  };

  const handleSectionMouseLeave = () => {
    animate(sectionMouseX, 0, { duration: 0.5 });
    animate(sectionMouseY, 0, { duration: 0.5 });
  };

  return (
    <section
      id="tokenization"
      ref={sectionRef}
      onMouseMove={handleSectionMouseMove}
      onMouseLeave={handleSectionMouseLeave}
      className="section-py bg-[--color-surface] overflow-hidden relative"
    >
      {/* Dynamic 3D Ambient Backdrop Shadow */}
      <motion.div
        style={{ x: sectionShadowX, y: sectionShadowY }}
        className="absolute top-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-primary/6 dark:bg-primary/3 blur-[125px] z-0 pointer-events-none select-none"
      />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column: Copy + 4 3D Cards */}
          <div className="space-y-10">
            <div className="space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.15 }}
                className="badge w-fit"
              >
                Tokenization & Assets
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.15 }}
                transition={{ delay: 0.08 }}
                className="font-[family-name:var(--font-manrope)] font-extrabold text-2xl sm:text-3xl md:text-4xl text-[--color-text-pri] leading-tight"
              >
                Preparing Pakistan for the tokenized economy.
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.15 }}
                transition={{ delay: 0.14 }}
                className="text-base text-[--color-text-sec] leading-relaxed max-w-xl"
              >
                From stablecoins to tokenized assets, the world is moving toward faster, more transparent, and more accessible financial systems. Coinsensei aims to support this evolution by making digital asset access easier for everyday users and businesses in Pakistan.
              </motion.p>
            </div>

            {/* Content Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {CARDS.map((card, i) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.15 }}
                  transition={{ delay: i * 0.08, duration: 0.55 }}
                  whileHover={{ 
                    scale: 1.02,
                    rotateY: 4,
                    rotateX: -3,
                    z: 5,
                    transition: { duration: 0.25, ease: 'easeOut' }
                  }}
                  className="feature-card p-6 bg-[--color-surface-card] border border-[--color-border] rounded-[1.5rem] flex flex-col gap-3 group cursor-pointer"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div 
                    className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center group-hover:scale-105 transition-all duration-300 icon-hover-gradient shrink-0"
                    style={{ transform: 'translateZ(15px)' }}
                  >
                    <Icon name={card.icon} filled size={20} className="group-hover:text-white" />
                  </div>
                  <div style={{ transform: 'translateZ(10px)' }}>
                    <h4 className="font-[family-name:var(--font-manrope)] font-bold text-base text-[--color-text-pri] mb-1.5 group-hover:text-primary transition-colors duration-300">
                      {card.title}
                    </h4>
                    <p className="text-xs text-[--color-text-muted] leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Column: Interactive 3D Visualizer */}
          <div 
            className="flex items-center justify-center select-none"
            style={{ perspective: 1000 }}
          >
            <div
              ref={containerRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative w-full max-w-[420px] h-[360px] sm:h-[420px] flex items-center justify-center cursor-crosshair rounded-[2.5rem] bg-gradient-to-br from-primary/[0.01] to-primary/[0.04] border border-[--color-border] overflow-hidden"
            >
              {/* Dynamic light rays / grids */}
              <div className="absolute inset-0 bg-grid opacity-15 pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,var(--color-surface)_80%)] pointer-events-none" />

              {/* Dynamic Cast Shadow (Shifts opposite to tilt) */}
              <motion.div
                style={{ 
                  x: shadowX, 
                  y: shadowY,
                }}
                className="absolute w-[240px] h-[240px] rounded-full bg-[radial-gradient(circle_at_center,var(--primary-light)_0%,transparent_70%)] opacity-20 dark:opacity-25 blur-3xl z-0 pointer-events-none"
              />

              {/* Centered 3D Card Object */}
              <motion.div
                style={{ 
                  rotateX, 
                  rotateY, 
                  transformStyle: 'preserve-3d' 
                }}
                className="relative w-[200px] h-[290px] sm:w-[230px] sm:h-[340px] rounded-3xl glass border border-primary/20 bg-gradient-to-b from-primary/[0.08] to-primary/[0.01] shadow-[0_30px_70px_rgba(0,0,0,0.3)] flex flex-col justify-between p-5 sm:p-6 z-10 overflow-hidden"
              >
                {/* Holographic shifting sheen overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/10 to-transparent translate-y-[-50%] rotate-45 pointer-events-none" />

                {/* Upper Details */}
                <div className="flex justify-between items-start" style={{ transform: 'translateZ(25px)' }}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                    <span className="text-[10px] font-bold tracking-widest text-[--color-text-muted] uppercase" style={{ fontFamily: 'var(--font-inter)' }}>
                      CoinSensei Labs
                    </span>
                  </div>
                  <Icon name="token" size={24} className="text-primary animate-pulse" />
                </div>

                {/* Holographic Central Element */}
                <div 
                  className="flex flex-col items-center justify-center my-6"
                  style={{ transform: 'translateZ(45px)' }}
                >
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center bg-gradient-to-tr from-[--color-primary-dark] to-[--color-primary] border-2 border-primary/30 shadow-[0_0_30px_var(--glow-color)] mb-3 sm:mb-4">
                    <Icon name="currency_exchange" filled size={32} className="text-white animate-[spin_10s_linear_infinite]" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-primary uppercase tracking-widest" style={{ fontFamily: 'var(--font-inter)' }}>
                    USDT / PKR Gateway
                  </span>
                </div>

                {/* Lower Details */}
                <div className="space-y-1.5" style={{ transform: 'translateZ(20px)' }}>
                  <div className="h-px bg-primary/10" />
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-[--color-text-muted]" style={{ fontFamily: 'var(--font-inter)' }}>
                        Status
                      </p>
                      <p className="text-[10px] sm:text-xs font-bold text-[--color-text-pri]">
                        Active Compliance
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] uppercase tracking-wider text-[--color-text-muted]" style={{ fontFamily: 'var(--font-inter)' }}>
                        On-Chain
                      </p>
                      <p className="text-[10px] sm:text-xs font-bold text-primary">
                        PKR Secure
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Floating Orbiting Particles/Tokens */}
              <motion.div
                animate={{ 
                  y: [0, -12, 0],
                  x: [0, 8, 0],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="hidden sm:flex absolute top-16 right-16 w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center shadow-lg backdrop-blur-md text-primary z-20"
                style={{ transform: 'translateZ(60px)' }}
              >
                <span className="text-xs font-extrabold" style={{ fontFamily: 'var(--font-inter)' }}>PKR</span>
              </motion.div>

              <motion.div
                animate={{ 
                  y: [0, 14, 0],
                  x: [0, -10, 0],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="hidden sm:flex absolute bottom-16 left-16 w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center shadow-lg backdrop-blur-md text-primary z-20"
                style={{ transform: 'translateZ(50px)' }}
              >
                <span className="text-[10px] font-black" style={{ fontFamily: 'var(--font-inter)' }}>USDT</span>
              </motion.div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
