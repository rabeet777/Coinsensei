"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRef, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { fadeUp, viewportOnce } from "@/lib/motion";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  index?: number;
  hover3d?: boolean;
};

/**
 * Instrument panel: matte surface, hairline border, corner tick marks,
 * and a cursor-following glow. Reveals with a staggered rise.
 */
export function GlassCard({
  children,
  className,
  index = 0,
  hover3d = false,
}: GlassCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--mx", `${e.clientX - r.left}px`);
    ref.current.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      variants={fadeUp}
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      whileHover={
        prefersReducedMotion
          ? undefined
          : hover3d
            ? { y: -6, rotateX: 2, rotateY: -2 }
            : { y: -4 }
      }
      style={{ transformPerspective: 900 }}
      className={cn(
        "panel group/card relative overflow-hidden rounded-md",
        "transition-colors duration-300 hover:border-brand/40",
        className
      )}
    >
      {/* cursor glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
        style={{
          background:
            "radial-gradient(220px circle at var(--mx, 50%) var(--my, 50%), rgb(var(--brand) / 0.09), transparent 65%)",
        }}
      />
      {/* corner ticks */}
      <span aria-hidden className="absolute left-0 top-0 h-3 w-px bg-brand/50" />
      <span aria-hidden className="absolute left-0 top-0 h-px w-3 bg-brand/50" />
      <span aria-hidden className="absolute bottom-0 right-0 h-3 w-px bg-brand/30" />
      <span aria-hidden className="absolute bottom-0 right-0 h-px w-3 bg-brand/30" />
      <div className="relative">{children}</div>
    </motion.div>
  );
}
