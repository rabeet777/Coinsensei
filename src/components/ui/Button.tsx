"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useRef, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "outline";
  size?: "md" | "lg";
  className?: string;
  type?: "button" | "submit";
  magnetic?: boolean;
};

/**
 * Instrument-style CTA: squared corners with a notched edge, mono
 * tracking, and a sweep highlight. Magnetic hover optional.
 */
export function Button({
  children,
  href,
  onClick,
  variant = "primary",
  size = "md",
  className,
  type = "button",
  magnetic = false,
}: ButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const handleMove = (e: MouseEvent) => {
    if (!magnetic || prefersReducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    ref.current.style.transform = `translate(${x * 0.16}px, ${y * 0.16}px)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = "translate(0, 0)";
  };

  const base = cn(
    "group relative inline-flex items-center justify-center gap-2.5 overflow-hidden select-none whitespace-nowrap",
    "font-mono uppercase tracking-[0.14em] transition-all duration-300",
    // notched corner via clip-path
    "[clip-path:polygon(0_0,calc(100%-14px)_0,100%_14px,100%_100%,14px_100%,0_calc(100%-14px))]",
    size === "lg" ? "px-8 py-4 text-[13px]" : "px-6 py-3 text-xs",
    variant === "primary" &&
      "bg-brand text-[#03161c] font-semibold hover:shadow-glow-sm hover:brightness-110",
    variant === "outline" &&
      "border border-line bg-surface/40 text-ink hover:border-brand/70 hover:text-brand",
    variant === "ghost" && "text-muted hover:text-brand",
    className
  );

  const content = (
    <>
      <span className="relative z-10 inline-flex items-center gap-2.5">
        {children}
      </span>
      {variant === "primary" && !prefersReducedMotion && (
        <span
          aria-hidden
          className="absolute inset-y-0 -left-1/3 z-0 w-1/3 -skew-x-12 bg-white/35 opacity-0 transition-all duration-500 group-hover:left-[120%] group-hover:opacity-100"
        />
      )}
    </>
  );

  const inner = href ? (
    <Link href={href} className={base} onClick={onClick}>
      {content}
    </Link>
  ) : (
    <button type={type} className={base} onClick={onClick}>
      {content}
    </button>
  );

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      className="inline-block transition-transform duration-200 ease-out"
      whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
    >
      {inner}
    </motion.div>
  );
}
