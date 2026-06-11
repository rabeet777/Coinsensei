"use client";

import { motion } from "framer-motion";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { AnimatedHeading } from "@/components/ui/AnimatedHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { PILLARS } from "@/lib/data";
import { viewportOnce } from "@/lib/motion";

export function WhyCoinsensei() {
  return (
    <SectionWrapper>
      <div className="mx-auto max-w-3xl text-center">
        <AnimatedHeading index="06" eyebrow="Why Coinsensei" align="center">
          Built for the next generation of digital finance.
        </AnimatedHeading>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-base leading-relaxed text-muted sm:text-lg"
        >
          Coinsensei is not just another conversion app. It is designed as a
          foundation for Pakistan&rsquo;s growing virtual asset ecosystem —
          combining simplicity, security, and accessibility in one mobile
          platform.
        </motion.p>
      </div>

      <div className="mt-10 grid gap-6 sm:mt-14 md:grid-cols-3">
        {PILLARS.map((p, i) => (
          <GlassCard key={p.title} index={i} hover3d className="p-9 text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center border border-line bg-surface-2 text-brand">
              <p.icon className="h-6 w-6" strokeWidth={1.6} />
            </div>
            <h3 className="font-display text-2xl font-semibold text-ink">
              {p.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {p.description}
            </p>
          </GlassCard>
        ))}
      </div>
    </SectionWrapper>
  );
}
