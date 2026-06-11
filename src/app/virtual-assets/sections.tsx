"use client";

import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  Coins,
  Globe2,
  Layers,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { GlassCard } from "@/components/ui/GlassCard";
import { viewportOnce } from "@/lib/motion";

const TOPICS = [
  {
    icon: Coins,
    title: "What are virtual assets?",
    text: "Virtual assets are digital representations of value that can be transferred, stored, or traded using digital technology.",
    diagram: "value",
  },
  {
    icon: Layers,
    title: "What is tokenization?",
    text: "Tokenization is the process of representing real-world or digital assets as tokens on a blockchain or digital ledger.",
    diagram: "token",
  },
  {
    icon: Globe2,
    title: "Why does it matter for Pakistan?",
    text: "Tokenization and virtual assets can support faster transactions, broader financial access, and stronger connection with global digital markets.",
    diagram: "globe",
  },
  {
    icon: ArrowLeftRight,
    title: "Where Coinsensei starts",
    text: "Coinsensei begins with PKR ⇄ USDT conversion and on-chain USDT transfers, giving users a practical entry point into the digital asset economy.",
    diagram: "flow",
  },
] as const;

/** Tiny inline diagrams — abstract, educational, on-brand. */
function Diagram({ kind }: { kind: (typeof TOPICS)[number]["diagram"] }) {
  const stroke = "rgb(var(--brand) / 0.7)";
  const faint = "rgb(var(--line))";
  switch (kind) {
    case "value":
      return (
        <svg viewBox="0 0 200 90" className="h-20 w-full" fill="none" aria-hidden>
          <rect x="10" y="25" width="40" height="40" rx="8" stroke={faint} />
          <text x="30" y="50" textAnchor="middle" fontSize="14" fill="rgb(var(--muted))">₨</text>
          <path d="M58 45h36m0 0-8-8m8 8-8 8" stroke={stroke} strokeWidth="1.5" />
          <circle cx="135" cy="45" r="22" stroke={stroke} strokeWidth="1.5" />
          <circle cx="135" cy="45" r="5" fill={stroke} />
          <path d="M165 45h25" stroke={faint} strokeDasharray="3 4" />
        </svg>
      );
    case "token":
      return (
        <svg viewBox="0 0 200 90" className="h-20 w-full" fill="none" aria-hidden>
          <rect x="12" y="20" width="48" height="50" rx="6" stroke={faint} />
          <path d="M20 32h32M20 42h32M20 52h22" stroke={faint} />
          <path d="M70 45h26" stroke={stroke} strokeWidth="1.5" />
          {[118, 146, 174].map((x) => (
            <g key={x}>
              <rect x={x - 11} y="34" width="22" height="22" rx="6" stroke={stroke} strokeWidth="1.5" />
              <circle cx={x} cy="45" r="3" fill={stroke} />
            </g>
          ))}
          <path d="M107 45h0M129 45h6M157 45h6" stroke={faint} />
        </svg>
      );
    case "globe":
      return (
        <svg viewBox="0 0 200 90" className="h-20 w-full" fill="none" aria-hidden>
          <circle cx="100" cy="45" r="32" stroke={faint} />
          <ellipse cx="100" cy="45" rx="32" ry="13" stroke={faint} />
          <path d="M100 13v64" stroke={faint} />
          {[
            [100, 45, 40, 18],
            [100, 45, 168, 26],
            [100, 45, 52, 76],
            [100, 45, 158, 70],
          ].map(([x1, y1, x2, y2], i) => (
            <g key={i}>
              <path d={`M${x1} ${y1}L${x2} ${y2}`} stroke={stroke} strokeWidth="1" strokeDasharray="3 4" />
              <circle cx={x2} cy={y2} r="3.5" fill={stroke} />
            </g>
          ))}
          <circle cx="100" cy="45" r="4.5" fill={stroke} />
        </svg>
      );
    case "flow":
      return (
        <svg viewBox="0 0 200 90" className="h-20 w-full" fill="none" aria-hidden>
          <rect x="14" y="28" width="52" height="34" rx="10" stroke={faint} />
          <text x="40" y="50" textAnchor="middle" fontSize="12" fill="rgb(var(--muted))">PKR</text>
          <path d="M74 38h44m0 0-7-7m7 7-7 7" stroke={stroke} strokeWidth="1.5" />
          <path d="M118 54H74m0 0 7-7m-7 7 7 7" stroke={stroke} strokeWidth="1.5" />
          <rect x="126" y="28" width="60" height="34" rx="10" stroke={stroke} strokeWidth="1.5" />
          <text x="156" y="50" textAnchor="middle" fontSize="12" fill="rgb(var(--brand))">USDT</text>
        </svg>
      );
  }
}

export function VirtualAssetsContent() {
  return (
    <>
      <PageHeader
        eyebrow="Virtual assets"
        title="Understanding the future of digital value."
        intro="Virtual assets are changing how people store, transfer, and access value globally. Stablecoins, blockchain networks, and tokenized assets are creating faster and more transparent ways to move value across borders."
      />

      <SectionWrapper width="narrow" className="!pt-6 !pb-10">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.6 }}
          className="text-center text-base leading-relaxed text-muted sm:text-lg"
        >
          Coinsensei is being built to help Pakistan participate in this
          digital shift through a simple and accessible mobile platform.
        </motion.p>
      </SectionWrapper>

      <SectionWrapper className="!pt-0">
        <div className="grid gap-6 md:grid-cols-2">
          {TOPICS.map((topic, i) => (
            <GlassCard key={topic.title} index={i} className="p-8">
              <div className="mb-5 flex h-11 w-11 items-center justify-center border border-line bg-surface-2 text-brand">
                <topic.icon className="h-5 w-5" />
              </div>
              <h2 className="font-display text-xl font-semibold text-ink">
                {topic.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                {topic.text}
              </p>
              <div className="mt-6 border border-line/70 bg-surface-2/40 p-4">
                <Diagram kind={topic.diagram} />
              </div>
            </GlassCard>
          ))}
        </div>
      </SectionWrapper>
    </>
  );
}
