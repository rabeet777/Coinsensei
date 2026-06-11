"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  UserCheck,
  Fingerprint,
  ScanLine,
  BadgeCheck,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { AnimatedHeading } from "@/components/ui/AnimatedHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { PhoneMockup } from "@/components/mockups/PhoneMockup";
import { OrbitMark } from "@/components/ui/OrbitMark";
import { SECURITY_SECTIONS } from "@/lib/data";
import { viewportOnce } from "@/lib/motion";

const VERIFICATION_STEPS = [
  { icon: UserCheck, label: "Create profile" },
  { icon: ScanLine, label: "Submit details" },
  { icon: Fingerprint, label: "Identity checks" },
  { icon: BadgeCheck, label: "Verified account" },
];

export function SecurityContent() {
  return (
    <>
      <PageHeader
        eyebrow="Security"
        title="Designed with security and transparency in mind."
        intro="Coinsensei is being developed with secure account access, verification flows, transaction tracking, and monitored withdrawals — built to support a safer digital asset experience."
      />

      {/* Six security principles */}
      <SectionWrapper>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SECURITY_SECTIONS.map((item, i) => (
            <GlassCard key={item.title} index={i} className="p-8">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center border border-line bg-surface-2 text-brand">
                <item.icon className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold text-ink">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted">
                {item.description}
              </p>
            </GlassCard>
          ))}
        </div>
      </SectionWrapper>

      {/* Verification flow illustration */}
      <SectionWrapper className="overflow-hidden">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <AnimatedHeading index="01" eyebrow="Verification">
              A guided path to a verified account.
            </AnimatedHeading>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="mb-10 max-w-xl text-base leading-relaxed text-muted"
            >
              Every Coinsensei profile moves through a structured verification
              flow before transacting. It is developed with transparent account
              flows in mind — so you always know which step you are on, and what
              comes next.
            </motion.p>

            <ol className="relative space-y-6">
              {VERIFICATION_STEPS.map((step, i) => (
                <motion.li
                  key={step.label}
                  initial={{ opacity: 0, x: -18 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={viewportOnce}
                  transition={{ duration: 0.55, delay: i * 0.12 }}
                  className="flex items-center gap-4"
                >
                  <span className="relative flex h-11 w-11 shrink-0 items-center justify-center border border-line bg-surface text-brand">
                    <step.icon className="h-5 w-5" strokeWidth={1.8} />
                    {i < VERIFICATION_STEPS.length - 1 && (
                      <span
                        aria-hidden
                        className="absolute left-1/2 top-full h-6 w-px -translate-x-1/2 bg-gradient-to-b from-line to-transparent"
                      />
                    )}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-sm font-semibold text-ink">
                      {step.label}
                    </span>
                    {i < VERIFICATION_STEPS.length - 1 && (
                      <ArrowRight
                        className="h-4 w-4 text-faint"
                        strokeWidth={1.6}
                      />
                    )}
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <OrbitMark className="absolute -right-16 -top-16 h-56 w-56 opacity-30" />
            <PhoneMockup
              screen="/app/12-Security-Settings.png"
              alt="Coinsensei security settings with two-factor authentication"
            />
          </div>
        </div>
      </SectionWrapper>

      {/* Monitoring + activity history */}
      <SectionWrapper width="wide">
        <AnimatedHeading index="02" eyebrow="Transparency" align="center">
          Every movement, recorded and reviewable.
        </AnimatedHeading>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mx-auto mb-16 max-w-2xl text-center text-base leading-relaxed text-muted"
        >
          Withdrawal processes are monitored and structured with checks, and the
          app helps users track their activity — from PKR deposits to on-chain
          confirmations with transaction hashes.
        </motion.p>

        <div className="grid items-end gap-10 sm:grid-cols-2 lg:gap-16">
          <div className="mx-auto w-full max-w-sm">
            <PhoneMockup
              screen="/app/10-Crypto-Transaction-Detail.png"
              alt="On-chain transaction detail with confirmed hash"
            />
            <p className="mt-5 text-center text-sm text-muted">
              On-chain transfers are confirmed with verifiable transaction
              hashes.
            </p>
          </div>
          <div className="mx-auto w-full max-w-sm">
            <PhoneMockup
              screen="/app/08-Transaction-History-PKR.png"
              alt="Transparent PKR activity log"
            />
            <p className="mt-5 text-center text-sm text-muted">
              A clear activity log keeps deposits, transfers, and withdrawals
              reviewable.
            </p>
          </div>
        </div>
      </SectionWrapper>

      {/* Closing note + CTA */}
      <SectionWrapper width="narrow">
        <GlassCard className="p-10 text-center sm:p-14">
          <div className="mx-auto mb-6 inline-flex h-14 w-14 items-center justify-center border border-line bg-surface-2 text-brand">
            <ShieldCheck className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <h3 className="mb-3 font-display text-2xl font-semibold text-ink">
            Security is a process, not a promise.
          </h3>
          <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-muted">
            No platform can guarantee absolute safety. Coinsensei is built to
            support safer transactions through verification, monitoring, and
            transparency — and to keep improving as the platform grows.
          </p>
          <Button href="/contact">Join the Waitlist</Button>
        </GlassCard>
      </SectionWrapper>
    </>
  );
}
