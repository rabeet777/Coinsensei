'use client';

import { motion } from 'framer-motion';

export function BubbleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Animated gradient bubbles with higher visibility */}
      <motion.div
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.5) 0%, rgba(59, 130, 246, 0.25) 40%, rgba(59, 130, 246, 0.1) 70%, transparent 100%)',
          filter: 'blur(40px)',
        }}
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute top-1/4 -right-20 w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.5) 0%, rgba(139, 92, 246, 0.25) 40%, rgba(139, 92, 246, 0.1) 70%, transparent 100%)',
          filter: 'blur(40px)',
        }}
        animate={{
          x: [0, -80, 0],
          y: [0, 60, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute bottom-0 left-1/3 w-[450px] h-[450px] rounded-full"
        style={{
          background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.45) 0%, rgba(16, 185, 129, 0.2) 40%, rgba(16, 185, 129, 0.08) 70%, transparent 100%)',
          filter: 'blur(40px)',
        }}
        animate={{
          x: [0, 120, 0],
          y: [0, -40, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute top-1/2 left-1/4 w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle at center, rgba(245, 158, 11, 0.45) 0%, rgba(245, 158, 11, 0.2) 40%, rgba(245, 158, 11, 0.08) 70%, transparent 100%)',
          filter: 'blur(40px)',
        }}
        animate={{
          x: [0, -60, 0],
          y: [0, 80, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute top-3/4 right-1/4 w-[350px] h-[350px] rounded-full"
        style={{
          background: 'radial-gradient(circle at center, rgba(236, 72, 153, 0.4) 0%, rgba(236, 72, 153, 0.2) 40%, rgba(236, 72, 153, 0.08) 70%, transparent 100%)',
          filter: 'blur(40px)',
        }}
        animate={{
          x: [0, 90, 0],
          y: [0, -70, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Additional smaller bubbles for depth */}
      <motion.div
        className="absolute top-20 right-1/3 w-[200px] h-[200px] rounded-full"
        style={{
          background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.5) 0%, rgba(99, 102, 241, 0.2) 50%, transparent 100%)',
          filter: 'blur(30px)',
        }}
        animate={{
          x: [0, -40, 0],
          y: [0, 30, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Subtle overlay gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30" />
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent" />
    </div>
  );
} 