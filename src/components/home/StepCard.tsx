"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Step } from "@/lib/data";

type StepCardProps = {
  step: Step;
  index: number;
  active?: boolean;
  completed?: boolean;
  isLast?: boolean;
  onActivate?: () => void;
};

/** One step in the how-it-works stepper, with an inline connector rail. */
export function StepCard({
  step,
  index,
  active,
  completed,
  isLast,
  onActivate,
}: StepCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onActivate}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group flex w-full items-stretch gap-4 text-left"
    >
      {/* Rail: number badge + connector to the next step */}
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center font-mono text-xs font-semibold transition-all duration-300",
            active
              ? "scale-110 bg-brand text-[#04141a] shadow-glow-sm"
              : completed
                ? "bg-brand/15 text-brand ring-1 ring-inset ring-brand/40"
                : "bg-surface-2 text-muted ring-1 ring-inset ring-line group-hover:text-ink group-hover:ring-brand/40"
          )}
        >
          {completed ? (
            <Check className="h-4 w-4" strokeWidth={2.5} />
          ) : (
            String(index + 1).padStart(2, "0")
          )}
        </span>

        {!isLast && (
          <div className="relative mt-2 w-px flex-1 overflow-hidden bg-line">
            <motion.span
              aria-hidden
              initial={false}
              animate={{ scaleY: completed ? 1 : 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 origin-top bg-gradient-to-b from-brand to-mint"
            />
          </div>
        )}
      </div>

      {/* Card body */}
      <div
        className={cn(
          "mb-2 flex-1 border p-5 transition-all duration-300",
          active
            ? "border-brand/60 bg-brand/[0.06] shadow-glow-sm"
            : "border-line bg-surface/60 group-hover:border-brand/30 group-hover:bg-surface/80"
        )}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-display text-base font-semibold text-ink">
            {step.title}
          </h3>
          {active && (
            <motion.span
              layoutId="step-active-dot"
              className="ml-auto h-1.5 w-1.5 rounded-full bg-brand shadow-glow-sm"
            />
          )}
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          {step.description}
        </p>
      </div>
    </motion.button>
  );
}
