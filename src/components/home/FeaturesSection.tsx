"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { AnimatedHeading } from "@/components/ui/AnimatedHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { HOME_FEATURES } from "@/lib/data";
import { viewportOnce } from "@/lib/motion";

export function FeaturesSection() {
  return (
    <SectionWrapper width="wide">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <AnimatedHeading index="05" eyebrow="Capabilities" className="mb-0">
          What you can do with Coinsensei
        </AnimatedHeading>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewportOnce}
          transition={{ delay: 0.2 }}
        >
          <Link
            href="/features"
            className="group inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.16em] text-brand"
          >
            Explore all features
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </div>

      <div className="mt-9 grid gap-5 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
        {HOME_FEATURES.map((f, i) => (
          <GlassCard key={f.title} index={i} className="p-7">
            <div className="mb-5 flex h-11 w-11 items-center justify-center border border-line bg-surface-2 text-brand">
              <f.icon className="h-5 w-5" strokeWidth={1.7} />
            </div>
            <h3 className="font-display text-lg font-semibold text-ink">
              {f.title}
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-muted">
              {f.description}
            </p>
          </GlassCard>
        ))}
      </div>
    </SectionWrapper>
  );
}
