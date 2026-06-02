'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  size: number;
  vx: number;
  vy: number;
  vz: number;
  baseAlpha: number;
}

interface ParticlesBackgroundProps {
  className?: string;
  quantity?: number;
  connections?: boolean;
}

export default function ParticlesBackground({
  className = '',
  quantity = 70,
  connections = true,
}: ParticlesBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    // Initialize particles in a 3D bounding box
    const initParticles = () => {
      particles = [];
      for (let i = 0; i < quantity; i++) {
        particles.push({
          x: (Math.random() - 0.5) * width * 1.8,
          y: (Math.random() - 0.5) * height * 1.8,
          z: Math.random() * 1000,
          size: Math.random() * 2 + 1.2,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          vz: -Math.random() * 0.8 - 0.2, // Drifting slowly forward
          baseAlpha: Math.random() * 0.4 + 0.3,
        });
      }
    };

    initParticles();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      initParticles();
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      // Mouse coordinates relative to the center of the canvas
      mouseRef.current.targetX = e.clientX - rect.left - rect.width / 2;
      mouseRef.current.targetY = e.clientY - rect.top - rect.height / 2;
    };

    const handleMouseLeave = () => {
      mouseRef.current.targetX = 0;
      mouseRef.current.targetY = 0;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    const fov = 350; // Field of View (Perspective)
    const maxDepth = 1000;

    // Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Check theme classes to adapt color dynamically
      const isLight = document.documentElement.classList.contains('light');
      const rgbColor = isLight ? '0, 91, 130' : '0, 216, 255'; // Cyan-teal in light, neon cyan in dark

      // Ease mouse position for silky smooth movement
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // Draw camera center parallax offset
      const camX = mouse.x * 0.18;
      const camY = mouse.y * 0.18;

      const projected: { x2d: number; y2d: number; z: number; alpha: number }[] = [];

      // Update & project particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Drift velocities
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        // Reset if they pass the camera (z <= 0) or get too far (z > maxDepth)
        if (p.z <= 0) {
          p.z = maxDepth;
          p.x = (Math.random() - 0.5) * width * 1.8;
          p.y = (Math.random() - 0.5) * height * 1.8;
        }

        // Clip/wrap boundaries in X and Y
        const boundaryX = width * 0.9;
        const boundaryY = height * 0.9;
        
        // 3D Perspective Projection
        const scale = fov / (fov + p.z);
        const x2d = (p.x - camX) * scale + width / 2;
        const y2d = (p.y - camY) * scale + height / 2;

        // Fade in when far, fade out when extremely close to camera
        let alpha = p.baseAlpha * (1 - p.z / maxDepth);
        if (p.z < 150) {
          alpha *= (p.z / 150); // Soft fade out as they reach the viewport plane
        }

        projected.push({ x2d, y2d, z: p.z, alpha });

        // Skip drawing if outside viewport
        if (x2d < 0 || x2d > width || y2d < 0 || y2d > height) {
          continue;
        }

        // Draw particle node
        ctx.beginPath();
        ctx.arc(x2d, y2d, p.size * scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgbColor}, ${alpha})`;
        ctx.fill();

        // Optional: Draw a subtle outer halo glow for the closest/largest particles
        if (p.z < 350) {
          ctx.beginPath();
          ctx.arc(x2d, y2d, p.size * scale * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgbColor}, ${alpha * 0.25})`;
          ctx.fill();
        }
      }

      // Draw interactive connections (Constellation nexus lines)
      if (connections) {
        ctx.lineWidth = 0.55;
        for (let i = 0; i < projected.length; i++) {
          const pA = projected[i];
          
          // Skip if node A is out of screen
          if (pA.x2d < 0 || pA.x2d > width || pA.y2d < 0 || pA.y2d > height) {
            continue;
          }

          let connectionCount = 0;

          for (let j = i + 1; j < projected.length; j++) {
            // Limit connections per particle to avoid visual noise and performance overhead
            if (connectionCount >= 3) break;

            const pB = projected[j];

            // Only connect if depths (z) are somewhat comparable
            if (Math.abs(pA.z - pB.z) > 130) continue;

            const dx = pA.x2d - pB.x2d;
            const dy = pA.y2d - pB.y2d;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Connect if close in 2D space
            if (dist < 110) {
              connectionCount++;
              const lineAlpha = Math.min(pA.alpha, pB.alpha) * (1 - dist / 110) * 0.45;
              ctx.beginPath();
              ctx.moveTo(pA.x2d, pA.y2d);
              ctx.lineTo(pB.x2d, pB.y2d);
              ctx.strokeStyle = `rgba(${rgbColor}, ${lineAlpha})`;
              ctx.stroke();
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [quantity, connections]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full block ${className}`}
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
