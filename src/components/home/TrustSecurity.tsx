"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Eye,
  FileClock,
  Fingerprint,
  ShieldCheck,
} from "lucide-react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { AnimatedHeading } from "@/components/ui/AnimatedHeading";
import { PhoneMockup } from "@/components/mockups/PhoneMockup";
import { viewportOnce } from "@/lib/motion";

const POINTS = [
  {
    icon: Fingerprint,
    title: "Verification flows",
    text: "Profiles are verified through guided onboarding steps.",
  },
  {
    icon: Eye,
    title: "Transaction monitoring",
    text: "Conversions, transfers, and withdrawals carry clear statuses.",
  },
  {
    icon: FileClock,
    title: "Transparent activity log",
    text: "Complete PKR and crypto histories, with hashes where relevant.",
  },
];

export function TrustSecurity() {
  return (
    <SectionWrapper className="overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/70 to-transparent"
      />
      <div className="relative grid items-center gap-10 sm:gap-14 lg:grid-cols-[0.85fr_1fr]">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={viewportOnce}
          transition={{ duration: 0.8 }}
          className="order-2 mx-auto w-full max-w-xs lg:order-1"
        >
          <PhoneMockup
            screen="/app/12-Security-Settings.png"
            alt="Coinsensei security settings showing two-factor authentication and device management"
          />
        </motion.div>

        <div className="order-1 lg:order-2">
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center border border-line bg-surface-2 text-brand">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <AnimatedHeading index="08" eyebrow="Trust">
            Designed with security and transparency at the core.
          </AnimatedHeading>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="max-w-xl text-base leading-relaxed text-muted sm:text-lg"
          >
            Coinsensei is being developed with secure account access,
            verification flows, transaction history, and monitored withdrawals
            to support a safer digital asset experience.
          </motion.p>

          <div className="mt-9 space-y-5">
            {POINTS.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={viewportOnce}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className="flex gap-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-line bg-surface text-brand">
                  <p.icon className="h-[18px] w-[18px]" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-ink">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {p.text}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <Link
            href="/security"
            className="group mt-9 inline-flex items-center gap-1.5 text-sm font-medium text-brand"
          >
            Read our security approach
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </SectionWrapper>
  );
}
