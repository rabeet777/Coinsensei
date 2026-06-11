"use client";

import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { PhoneMockup } from "@/components/mockups/PhoneMockup";
import { FEATURES_PAGE } from "@/lib/data";
import { cn } from "@/lib/utils";
import { viewportOnce } from "@/lib/motion";

export function FeaturesContent() {
  return (
    <>
      <PageHeader
        eyebrow="Features"
        title="Everything the app does, explained."
        intro="Coinsensei focuses on a small set of things and does them clearly: converting between PKR and USDT, moving value on-chain, and keeping your activity transparent."
      />

      <SectionWrapper width="wide" className="!pt-8">
        <div className="space-y-16">
          {FEATURES_PAGE.map((feature, i) => {
            const reversed = i % 2 === 1;
            return (
              <div
                key={feature.title}
                className={cn(
                  "grid items-center gap-12 border-t border-line/40 pt-16 first:border-t-0 first:pt-0 lg:grid-cols-2",
                  reversed && "lg:[&>*:first-child]:order-2"
                )}
              >
                <motion.div
                  initial={{ opacity: 0, x: reversed ? 32 : -32 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={viewportOnce}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="mb-5 flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center border border-line bg-surface-2 text-brand">
                      <feature.icon className="h-6 w-6" strokeWidth={1.7} />
                    </span>
                    <span className="font-mono text-xs tracking-[0.2em] text-faint">
                      F·{String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                    {feature.title}
                  </h2>
                  <p className="mt-3 text-base font-medium text-brand">
                    {feature.description}
                  </p>
                  <p className="mt-4 max-w-lg leading-relaxed text-muted">
                    {feature.detail}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewportOnce}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="mx-auto w-full max-w-[260px]"
                >
                  {feature.screen && (
                    <PhoneMockup screen={feature.screen} alt={feature.title} />
                  )}
                </motion.div>
              </div>
            );
          })}
        </div>
      </SectionWrapper>
    </>
  );
}
