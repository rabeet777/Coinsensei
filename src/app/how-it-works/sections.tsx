"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { PageHeader } from "@/components/ui/PageHeader";
import { PhoneMockup } from "@/components/mockups/PhoneMockup";
import { JOURNEY_STEPS } from "@/lib/data";
import { viewportOnce } from "@/lib/motion";

/**
 * Scroll-driven storytelling: a progress spine grows with scroll while
 * each step (copy + screen) reveals alternately left and right.
 */
export function JourneyContent() {
  const spineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: spineRef,
    offset: ["start 0.7", "end 0.6"],
  });
  const scaleY = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });

  return (
    <>
      <PageHeader
        eyebrow="The journey"
        title="Your path into digital assets."
        intro="Six steps from download to a fully tracked digital asset account. No trading jargon, no guesswork — every step is guided."
      />

      <div ref={spineRef} className="relative mx-auto max-w-5xl px-5 pb-32 pt-10 sm:px-8">
        {/* progress spine */}
        <div
          aria-hidden
          className="absolute left-7 top-0 h-full w-px bg-line sm:left-1/2"
        >
          <motion.div
            style={{ scaleY }}
            className="h-full w-full origin-top bg-gradient-to-b from-brand via-brand to-mint"
          />
        </div>

        <div className="space-y-24">
          {JOURNEY_STEPS.map((step, i) => {
            const right = i % 2 === 1;
            return (
              <div
                key={step.title}
                className="relative grid items-center gap-8 pl-16 sm:grid-cols-2 sm:gap-16 sm:pl-0"
              >
                {/* node */}
                <div className="absolute left-7 top-2 z-10 -translate-x-1/2 sm:left-1/2">
                  <motion.span
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={viewportOnce}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex h-9 w-9 items-center justify-center border border-brand/50 bg-bg font-mono text-xs font-semibold text-brand shadow-glow-sm"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </motion.span>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewportOnce}
                  transition={{ duration: 0.7 }}
                  className={right ? "sm:order-2 sm:pl-14" : "sm:pr-14 sm:text-right"}
                >
                  <h2 className="font-display text-2xl font-semibold text-ink">
                    {step.title}
                  </h2>
                  <p className="mt-3 leading-relaxed text-muted">
                    {step.description}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={viewportOnce}
                  transition={{ duration: 0.8 }}
                  className={
                    right
                      ? "sm:order-1 sm:justify-self-end sm:pr-14"
                      : "sm:justify-self-start sm:pl-14"
                  }
                >
                  <div className="w-52 sm:w-60">
                    <PhoneMockup screen={step.screen} alt={step.title} />
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
