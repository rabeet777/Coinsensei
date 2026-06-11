"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { viewportOnce } from "@/lib/motion";

type AnimatedHeadingProps = {
  children: ReactNode;
  eyebrow?: string;
  /** Ledger index, e.g. "01" — rendered in Eastern-Arabic numerals. */
  index?: string;
  className?: string;
  as?: "h1" | "h2" | "h3";
  align?: "left" | "center";
};

const URDU_DIGITS: Record<string, string> = {
  "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴",
  "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹",
};
export const toUrdu = (n: string) =>
  n.replace(/[0-9]/g, (d) => URDU_DIGITS[d]);

/**
 * Section heading in the ledger voice: a mono eyebrow rule with an
 * Eastern-Arabic index numeral, then a masked rise-in display line.
 */
export function AnimatedHeading({
  children,
  eyebrow,
  index,
  className,
  as = "h2",
  align = "left",
}: AnimatedHeadingProps) {
  const Tag = motion[as];
  return (
    <div className={cn(align === "center" && "text-center", "mb-6 sm:mb-8")}>
      {(eyebrow || index) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.5 }}
          className={cn(
            "mb-4 flex items-center gap-3 sm:mb-5",
            align === "center" && "justify-center"
          )}
        >
          {index && (
            <span className="index-urdu" aria-hidden>
              {toUrdu(index)}
            </span>
          )}
          <span
            aria-hidden
            className="h-px w-8 bg-gradient-to-r from-brand/80 to-transparent"
          />
          {eyebrow && <span className="label-mono">{eyebrow}</span>}
        </motion.div>
      )}
      <div className="overflow-hidden">
        <Tag
          initial={{ opacity: 0, y: "70%" }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "font-display font-medium tracking-tight text-ink",
            as === "h1" &&
              "text-[2.1rem] leading-[1.08] sm:text-5xl lg:text-6xl",
            as === "h2" && "text-[1.7rem] leading-[1.12] sm:text-4xl",
            as === "h3" && "text-xl leading-snug sm:text-2xl",
            className
          )}
        >
          {children}
        </Tag>
      </div>
    </div>
  );
}
