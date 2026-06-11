"use client";

import { motion } from "framer-motion";
import { Compass, Flag, Globe2, Rocket, Send, Target } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedHeading } from "@/components/ui/AnimatedHeading";
import { OrbitMark } from "@/components/ui/OrbitMark";
import { viewportOnce } from "@/lib/motion";

const ROADMAP = [
  {
    icon: Flag,
    phase: "Now",
    title: "Foundation",
    text: "PKR ⇄ USDT conversion with live rates, verified accounts, and on-chain USDT transfers.",
  },
  {
    icon: Rocket,
    phase: "Next",
    title: "Launch",
    text: "Public release on Android and iOS, with monitored withdrawals and full transaction history.",
  },
  {
    icon: Send,
    phase: "Then",
    title: "Expansion",
    text: "Broader virtual asset support and smoother on-chain movement across supported networks.",
  },
  {
    icon: Globe2,
    phase: "Beyond",
    title: "Tokenized finance",
    text: "A platform ready for tokenized assets and Pakistan's growing connection to global digital value.",
  },
];

export function AboutContent() {
  return (
    <>
      <PageHeader
        eyebrow="About Coinsensei"
        title="Digitalizing Pakistan's access to virtual assets."
        intro="Coinsensei is building a modern digital asset platform for Pakistan. Our goal is to make virtual asset access simpler, safer, and easier to understand for everyday users and businesses."
      />

      <SectionWrapper width="narrow" className="!pt-10">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.7 }}
          className="text-lg leading-relaxed text-muted sm:text-xl"
        >
          We believe Pakistan&rsquo;s financial future will be more digital,
          more connected, and more accessible. Coinsensei is starting with
          seamless PKR and USDT conversion, while building toward a broader
          ecosystem for virtual assets, on-chain transfers, and tokenized
          finance.
        </motion.p>
      </SectionWrapper>

      <SectionWrapper className="!pt-0">
        <div className="grid gap-6 md:grid-cols-2">
          <GlassCard index={0} className="p-9">
            <div className="mb-5 flex h-12 w-12 items-center justify-center border border-line bg-surface-2 text-brand">
              <Target className="h-6 w-6" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-ink">
              Mission
            </h2>
            <p className="mt-3 leading-relaxed text-muted">
              To simplify access to virtual assets in Pakistan through secure,
              transparent, and user-friendly technology.
            </p>
          </GlassCard>
          <GlassCard index={1} className="p-9">
            <div className="mb-5 flex h-12 w-12 items-center justify-center border border-line bg-surface-2 text-brand">
              <Compass className="h-6 w-6" />
            </div>
            <h2 className="font-display text-2xl font-semibold text-ink">
              Vision
            </h2>
            <p className="mt-3 leading-relaxed text-muted">
              To become Pakistan&rsquo;s trusted gateway to digital assets and
              tokenized finance.
            </p>
          </GlassCard>
        </div>
      </SectionWrapper>

      <SectionWrapper className="overflow-hidden">
        <OrbitMark className="absolute -left-24 bottom-0 opacity-30" size={300} />
        <AnimatedHeading index="02" eyebrow="Roadmap" align="center">
          Where we&rsquo;re headed
        </AnimatedHeading>

        <div className="relative mt-12">
          {/* connecting line */}
          <div
            aria-hidden
            className="absolute left-6 top-0 h-full w-px bg-line lg:left-0 lg:top-7 lg:h-px lg:w-full"
          />
          <div className="grid gap-10 lg:grid-cols-4 lg:gap-6">
            {ROADMAP.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportOnce}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className="relative pl-16 lg:pl-0 lg:pt-16"
              >
                <div className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center border border-brand/40 bg-surface font-mono text-brand shadow-glow-sm lg:left-0">
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="label-mono !text-brand">
                  {item.phase}
                </p>
                <h3 className="mt-1.5 font-display text-lg font-semibold text-ink">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionWrapper>
    </>
  );
}
