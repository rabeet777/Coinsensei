"use client";

import { motion } from "framer-motion";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { AnimatedHeading } from "@/components/ui/AnimatedHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { TOKENIZATION_CARDS } from "@/lib/data";
import { viewportOnce } from "@/lib/motion";

/** Bento: one wide anchor cell + three instrument cells. */
export function Tokenization() {
  const [first, ...rest] = TOKENIZATION_CARDS;

  return (
    <SectionWrapper width="wide">
      <div className="max-w-3xl">
        <AnimatedHeading index="03" eyebrow="Tokenized economy">
          Preparing Pakistan for the tokenized economy.
        </AnimatedHeading>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-base leading-relaxed text-muted sm:text-lg"
        >
          From stablecoins to tokenized assets, the world is moving toward
          faster, more transparent, and more accessible financial systems.
          Coinsensei aims to support this evolution for everyday users and
          businesses in Pakistan.
        </motion.p>
      </div>

      <div className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3">
        {/* anchor cell */}
        <GlassCard index={0} className="p-8 sm:col-span-2 sm:p-10">
          <div className="flex h-full flex-col justify-between gap-8">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h3 className="font-display text-xl font-semibold text-ink sm:text-2xl">
                  {first.title}
                </h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
                  {first.description}
                </p>
              </div>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-line bg-surface-2 text-brand">
                <first.icon className="h-5 w-5" strokeWidth={1.7} />
              </span>
            </div>
            {/* animated value stream */}
            <div aria-hidden className="relative h-16 overflow-hidden">
              <svg
                viewBox="0 0 600 64"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full"
              >
                <defs>
                  <linearGradient id="tk-flow" x1="0" x2="1">
                    <stop offset="0" stopColor="rgb(var(--brand))" />
                    <stop offset="1" stopColor="rgb(var(--mint))" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 46 C 90 46 110 14 200 14 S 320 50 410 50 540 18 600 18"
                  fill="none"
                  stroke="url(#tk-flow)"
                  strokeWidth="1.5"
                  strokeDasharray="5 7"
                  className="[stroke-dashoffset:0] motion-safe:animate-[dash_5s_linear_infinite]"
                />
                <style>{`@keyframes dash { to { stroke-dashoffset: -120; } }`}</style>
              </svg>
              <span className="absolute bottom-0 left-0 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
                PKR
              </span>
              <span className="absolute right-0 top-0 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
                Tokenized value
              </span>
            </div>
          </div>
        </GlassCard>

        {rest.map((card, i) => (
          <GlassCard key={card.title} index={i + 1} className="p-8">
            <span className="mb-6 flex h-11 w-11 items-center justify-center border border-line bg-surface-2 text-brand">
              <card.icon className="h-5 w-5" strokeWidth={1.7} />
            </span>
            <h3 className="font-display text-lg font-semibold text-ink">
              {card.title}
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-muted">
              {card.description}
            </p>
          </GlassCard>
        ))}
      </div>
    </SectionWrapper>
  );
}
