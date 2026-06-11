"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const COLUMN = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * Rolling-digit readout. Each numeral is a vertical column of 0–9 that
 * springs to position — the site's "live rate" voice.
 */
export function Odometer({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <span
      className={cn(
        "inline-flex font-mono tabular-nums leading-none",
        className
      )}
      aria-label={value}
    >
      {value.split("").map((ch, i) =>
        /[0-9]/.test(ch) ? (
          <span
            key={i}
            className="relative inline-block overflow-hidden"
            style={{ height: "1em", width: "0.62em" }}
            aria-hidden
          >
            <motion.span
              className="absolute left-0 top-0 flex flex-col items-center"
              animate={{ y: `-${Number(ch)}em` }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 130, damping: 22 }
              }
            >
              {COLUMN.map((d) => (
                <span key={d} style={{ height: "1em" }}>
                  {d}
                </span>
              ))}
            </motion.span>
          </span>
        ) : (
          <span key={i} aria-hidden>
            {ch}
          </span>
        )
      )}
    </span>
  );
}
