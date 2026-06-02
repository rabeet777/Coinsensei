'use client';

import { useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import Icon from '@/components/ui/Icon';

export default function ProductIntro() {
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
      id="product-intro"
      ref={sectionRef}
      onMouseMove={handleSectionMouseMove}
      onMouseLeave={handleSectionMouseLeave}
      className="section-py bg-[--color-surface] overflow-hidden relative"
    >
      {/* Dynamic 3D Ambient Backdrop Shadow */}
      <motion.div
        style={{ x: sectionShadowX, y: sectionShadowY }}
        className="absolute top-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-primary/6 dark:bg-primary/3 blur-[125px] z-0 pointer-events-none select-none"
      />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column: Copy */}
          <div className="space-y-6 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              className="badge w-fit"
            >
              Core Services
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ delay: 0.08 }}
              className="font-[family-name:var(--font-manrope)] font-extrabold text-2xl sm:text-3xl md:text-4xl text-[--color-text-pri] leading-tight"
            >
              Starting with what Pakistan needs most: simple PKR and USDT access.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ delay: 0.14 }}
              className="text-base text-[--color-text-sec] leading-relaxed max-w-xl font-medium"
            >
              Coinsensei begins with a practical solution — helping users convert PKR to USDT and USDT to PKR with live rates, guided transactions, and secure account flows.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-[--color-text-muted] leading-relaxed max-w-xl"
            >
              This makes the website feel bigger than just an exchange, but still keeps a clear, practical focus on the core product that our customers rely on daily for secure local settlements.
            </motion.p>
          </div>

          {/* Right Column: 3D Conversion Visualizer */}
          <div 
            className="flex items-center justify-center select-none"
            style={{ perspective: 1200 }}
          >
            <div
              ref={containerRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative w-full max-w-[420px] h-[380px] sm:h-[440px] flex items-center justify-center cursor-crosshair rounded-[2.5rem] bg-gradient-to-br from-primary/[0.01] to-primary/[0.04] border border-[--color-border] overflow-hidden"
            >
              {/* Grid Background */}
              <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,var(--color-surface)_80%)] pointer-events-none" />

              {/* Cast Shadow (Shifts opposite to tilt) */}
              <motion.div
                style={{ 
                  x: shadowX, 
                  y: shadowY,
                }}
                className="absolute w-[260px] h-[260px] rounded-full bg-[radial-gradient(circle_at_center,var(--primary-light)_0%,transparent_70%)] opacity-15 dark:opacity-20 blur-3xl z-0 pointer-events-none"
              />

              {/* Main 3D Panel */}
              <motion.div
                style={{ 
                  rotateX, 
                  rotateY, 
                  transformStyle: 'preserve-3d' 
                }}
                className="relative w-[230px] h-[310px] sm:w-[260px] sm:h-[350px] rounded-3xl glass border border-primary/15 bg-gradient-to-b from-primary/[0.08] to-primary/[0.01] shadow-[0_30px_70px_rgba(0,0,0,0.35)] flex flex-col justify-between p-5 sm:p-6 z-10 overflow-hidden"
              >
                {/* Sheen effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/5 to-transparent translate-y-[-50%] rotate-45 pointer-events-none" />

                {/* Upper block: Send PKR */}
                <div 
                  className="rounded-2xl border border-[--color-border] bg-[--color-surface-mid]/80 p-3 sm:p-4 space-y-1"
                  style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }}
                >
                  <p className="text-[10px] font-bold text-[--color-text-muted] uppercase tracking-wider">
                    You Send
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="font-[family-name:var(--font-manrope)] font-bold text-base sm:text-lg text-[--color-text-pri]">
                      PKR 28,050
                    </span>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-surface-high/60 border border-[--color-border]">
                      <span className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center bg-emerald-600 text-[8px] font-black text-white select-none">
                        🇵🇰
                      </span>
                      <span className="text-[10px] font-bold text-[--color-text-pri]">
                        PKR
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vertical swap indicator */}
                <div 
                  className="w-8 h-8 rounded-full border border-primary/30 bg-[--color-surface-mid] text-primary flex items-center justify-center mx-auto my-[-10px] z-20 shadow-md"
                  style={{ transform: 'translateZ(30px)' }}
                >
                  <Icon name="swap_vert" size={16} />
                </div>

                {/* Lower block: Receive USDT */}
                <div 
                  className="rounded-2xl border border-[--color-border] bg-[--color-surface-mid]/80 p-3 sm:p-4 space-y-1"
                  style={{ transform: 'translateZ(40px)', transformStyle: 'preserve-3d' }}
                >
                  <p className="text-[10px] font-bold text-[--color-text-muted] uppercase tracking-wider">
                    You Receive
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="font-[family-name:var(--font-manrope)] font-bold text-base sm:text-lg text-primary">
                      100.00 USDT
                    </span>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-surface-high/60 border border-[--color-border]">
                      <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm select-none">
                        <Icon name="attach_money" size={10} className="text-white" />
                      </div>
                      <span className="text-[10px] font-bold text-[--color-text-pri]">
                        USDT
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live rate ticker */}
                <div 
                  className="flex items-center justify-between text-[10px] text-[--color-text-muted] mt-3"
                  style={{ transform: 'translateZ(15px)' }}
                >
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-[pulse-dot_2s_infinite]" />
                    <span>Live exchange rate</span>
                  </div>
                  <span className="font-semibold text-[--color-text-pri]">
                    1 USDT = 280.50 PKR
                  </span>
                </div>

              </motion.div>

              {/* Floating Orbiting elements */}
              <motion.div
                animate={{ 
                  y: [-8, 8, -8],
                  rotate: [0, 4, 0]
                }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                className="hidden sm:flex absolute top-14 left-10 p-3 rounded-2xl glass border border-[--color-border] flex-col items-center justify-center shadow-lg"
                style={{ transform: 'translateZ(60px)' }}
              >
                <Icon name="check_circle" filled size={18} className="text-emerald-500 mb-1" />
                <span className="text-[9px] font-extrabold text-[--color-text-pri] tracking-widest uppercase">
                  Verified
                </span>
              </motion.div>

              <motion.div
                animate={{ 
                  y: [8, -8, 8],
                  rotate: [0, -4, 0]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="hidden sm:flex absolute bottom-14 right-10 p-3 rounded-2xl glass border border-[--color-border] flex-col items-center justify-center shadow-lg"
                style={{ transform: 'translateZ(50px)' }}
              >
                <Icon name="lock" filled size={18} className="text-primary mb-1" />
                <span className="text-[9px] font-extrabold text-[--color-text-pri] tracking-widest uppercase">
                  Secured
                </span>
              </motion.div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
