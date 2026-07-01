"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { AnimatedHeading, toUrdu } from "@/components/ui/AnimatedHeading";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  intro?: string;
};

/**
 * Inner-page hero: ledger route line + oversized display title over a
 * faint lattice. Each page carries its route as a mono breadcrumb.
 */
export function PageHeader({ eyebrow, title, intro }: PageHeaderProps) {
  const pathname = usePathname() ?? "/";
  const LEDGER: Record<string, string> = {
    "/": "01",
    "/about": "02",
    "/virtual-assets": "03",
    "/features": "04",
    "/how-it-works": "05",
    "/security": "06",
    "/faq": "07",
    "/contact": "08",
    "/privacy-policy": "09",
    "/delete-account": "10",
  };
  const index = LEDGER[pathname] ?? "01";
  return (
    <div className="relative overflow-hidden px-5 pb-14 pt-36 sm:px-8 sm:pb-20 sm:pt-44">
      {/* backdrop: lattice + flow glow */}
      <div aria-hidden className="absolute inset-0 token-grid opacity-40" />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 70% at 50% -10%, rgb(var(--brand) / 0.12), transparent 60%), radial-gradient(60% 50% at 85% 10%, rgb(var(--mint) / 0.06), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-line to-transparent"
      />

      <div className="rails relative mx-auto max-w-6xl sm:px-10">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="label-mono mb-6 flex items-center gap-3"
        >
          <span className="text-brand">coinsensei</span>
          <span className="text-faint">{pathname}</span>
          <span aria-hidden className="index-urdu animate-blink">▌</span>
        </motion.p>

        <AnimatedHeading as="h1" eyebrow={eyebrow} className="max-w-3xl">
          {title}
        </AnimatedHeading>

        {intro && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg"
          >
            {intro}
          </motion.p>
        )}

        {/* oversized ghost numeral of the page's place in the ledger */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-16 right-0 hidden select-none font-mono text-[11rem] leading-none text-outline opacity-50 lg:block"
        >
          {toUrdu(index)}
        </span>
      </div>
    </div>
  );
}
