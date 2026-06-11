"use client";

import { motion } from "framer-motion";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { AnimatedHeading } from "@/components/ui/AnimatedHeading";
import { WaitlistForm } from "@/components/forms/WaitlistForm";
import { viewportOnce } from "@/lib/motion";

/** Closing CTA — a terminal panel with a scanline sweeping the surface. */
export function WaitlistSection() {
  return (
    <SectionWrapper id="waitlist">
      <div className="panel relative overflow-hidden">
        {/* terminal header strip */}
        <div className="flex items-center justify-between border-b border-line/60 px-6 py-3 sm:px-10">
          <span className="label-mono text-faint">
            coinsensei://waitlist
          </span>
          <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-mint">
            <span className="h-1.5 w-1.5 rounded-full bg-mint animate-pulse-soft" />
            Accepting entries
          </span>
        </div>

        <div aria-hidden className="absolute inset-0 token-grid opacity-40" />
        {/* scanline */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-24 animate-scanline bg-gradient-to-b from-transparent via-brand/[0.06] to-transparent"
        />

        <div className="relative grid items-center gap-8 px-6 py-12 sm:gap-12 sm:px-10 sm:py-16 lg:grid-cols-2">
          <div>
            <AnimatedHeading index="09" eyebrow="Early access">
              Be part of Pakistan&rsquo;s digital asset future.
            </AnimatedHeading>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="max-w-md text-base leading-relaxed text-muted sm:text-lg"
            >
              Join the Coinsensei waitlist and get early updates before launch.
            </motion.p>
          </div>
          <WaitlistForm />
        </div>
      </div>
    </SectionWrapper>
  );
}
