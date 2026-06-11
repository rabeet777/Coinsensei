"use client";

import { motion } from "framer-motion";
import { Mail, Briefcase, Smartphone, Instagram, Facebook } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { AnimatedHeading } from "@/components/ui/AnimatedHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { WaitlistForm } from "@/components/forms/WaitlistForm";
import { ContactForm } from "@/components/forms/ContactForm";
import { OrbitMark } from "@/components/ui/OrbitMark";
import { viewportOnce } from "@/lib/motion";

/** TikTok brand glyph (lucide-react has no TikTok icon). */
function TikTok({ className }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M16.5 5.6a4.6 4.6 0 0 1-1.1-.9 4.6 4.6 0 0 1-1.1-2.2H11v12.4a2.6 2.6 0 1 1-1.9-2.5V9a5.6 5.6 0 1 0 4.8 5.5V8.8a7.6 7.6 0 0 0 4.4 1.4V7.1a4.6 4.6 0 0 1-1.8-1.5Z" />
    </svg>
  );
}

const SOCIALS = [
  {
    icon: Instagram,
    label: "Instagram",
    href: "https://instagram.com/coinsensei.co",
  },
  {
    icon: TikTok,
    label: "TikTok",
    href: "https://www.tiktok.com/@coin_sensei",
  },
  {
    icon: Facebook,
    label: "Facebook",
    href: "https://www.facebook.com/share/1EAACYw9gp/?mibextid=wwXIfr",
  },
];

export function ContactContent() {
  return (
    <>
      <PageHeader
        eyebrow="Contact & Waitlist"
        title="Be first in line."
        intro="Coinsensei is launching soon on Android and iOS. Join the waitlist for early access, or reach out to the team directly."
      />

      {/* Waitlist */}
      <SectionWrapper className="pt-8 sm:pt-12">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="relative">
            <OrbitMark className="absolute -left-20 -top-12 h-48 w-48 opacity-25" />
            <AnimatedHeading index="01" eyebrow="Early access">
              Join the waitlist.
            </AnimatedHeading>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="mb-8 max-w-lg text-base leading-relaxed text-muted"
            >
              Get notified the moment Coinsensei goes live in Pakistan — and be
              among the first to convert PKR to USDT with live rates and
              on-chain transfers.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="panel flex items-center gap-4 p-5"
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-line bg-surface-2 text-brand">
                <Smartphone className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <div>
                <p className="font-display text-sm font-semibold text-ink">
                  Launching soon on Android and iOS
                </p>
                <p className="text-xs text-muted">
                  Waitlist members hear about it first.
                </p>
              </div>
            </motion.div>
          </div>

          <GlassCard className="p-8 sm:p-10">
            <WaitlistForm />
          </GlassCard>
        </div>
      </SectionWrapper>

      {/* Contact + business */}
      <SectionWrapper>
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <GlassCard className="order-2 p-8 sm:p-10 lg:order-1">
            <ContactForm />
          </GlassCard>

          <div className="order-1 lg:order-2">
            <AnimatedHeading index="02" eyebrow="Get in touch">
              Talk to the team.
            </AnimatedHeading>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="mb-8 max-w-lg text-base leading-relaxed text-muted"
            >
              Questions about the platform, partnerships, or press? Send us a
              message and we will get back to you.
            </motion.p>

            <div className="space-y-4">
              <div className="panel flex items-center gap-4 p-5">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-line bg-surface-2 text-brand">
                  <Mail className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <div>
                  <p className="font-display text-sm font-semibold text-ink">
                    Email
                  </p>
                  <a
                    href="mailto:admin@coinsensei.co"
                    className="text-xs text-muted transition-colors hover:text-brand"
                  >
                    admin@coinsensei.co
                  </a>
                </div>
              </div>

              <div className="panel flex items-center gap-4 p-5">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-line bg-surface-2 text-brand">
                  <Briefcase className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <div>
                  <p className="font-display text-sm font-semibold text-ink">
                    Business inquiries
                  </p>
                  <p className="text-xs text-muted">
                    Select “Business inquiry” in the form — partnerships and
                    institutional conversations welcome.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                {SOCIALS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="panel inline-flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-brand"
                  >
                    <s.icon className="h-4 w-4" strokeWidth={1.8} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>
    </>
  );
}
