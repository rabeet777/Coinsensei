"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Odometer } from "@/components/ui/Odometer";
import { toUrdu } from "@/components/ui/AnimatedHeading";

const FlowField = dynamic(() => import("@/components/three/FlowField"), {
  ssr: false,
});

const EASE = [0.22, 1, 0.36, 1] as const;

const line = (delay: number) => ({
  initial: { y: "105%" },
  animate: { y: 0 },
  transition: { duration: 1.05, delay, ease: EASE },
});

/** Hero — "The Exchange Field". The live rate is the protagonist. */
export function Hero() {
  const prefersReducedMotion = useReducedMotion();

  // simulated live rate — replace with a real feed when available
  const [rate, setRate] = useState(297.42);
  const [delta, setDelta] = useState(0.08);
  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = setInterval(() => {
      const d = (Math.random() - 0.48) * 0.3;
      setDelta(d);
      setRate((r) => Math.min(299.9, Math.max(295.2, r + d)));
    }, 2600);
    return () => clearInterval(id);
  }, [prefersReducedMotion]);

  return (
    <section className="dark noise relative flex min-h-[100svh] flex-col overflow-hidden bg-bg text-ink">
      {/* WebGL flow field */}
      <FlowField />
      {/* darken edges so type stays legible */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgb(var(--bg) / 0.72) 0%, rgb(var(--bg) / 0.18) 38%, rgb(var(--bg) / 0.30) 70%, rgb(var(--bg)) 100%)",
        }}
      />

      <div className="rails relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 pt-32 sm:px-12 sm:pt-36">
        {/* status line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="label-mono mb-10 flex flex-wrap items-center gap-x-4 gap-y-2 sm:mb-14"
        >
          <span className="flex items-center gap-2 text-mint">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
            </span>
            Field live
          </span>
          <span className="text-faint">/</span>
          <span>PKR ⇄ USDT</span>
          <span className="text-faint">/</span>
          <span className="text-faint">Launching soon · Android &amp; iOS</span>
        </motion.div>

        {/* headline — masked line reveals */}
        <h1 className="max-w-5xl font-display font-semibold tracking-tight text-ink">
          <span className="block overflow-hidden">
            <motion.span
              {...line(0.15)}
              className="block text-[clamp(2.1rem,7vw,5.2rem)] leading-[1.04]"
            >
              Digitalizing Pakistan&rsquo;s
            </motion.span>
          </span>
          <span className="block overflow-hidden">
            <motion.span
              {...line(0.28)}
              className="block text-[clamp(2.1rem,7vw,5.2rem)] leading-[1.04]"
            >
              <span className="text-flow">virtual asset</span> future.
            </motion.span>
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.55, ease: EASE }}
          className="mt-7 max-w-xl text-base leading-relaxed text-muted sm:text-lg"
        >
          A secure and simple platform to access virtual assets — starting
          with PKR ⇄ USDT conversion, live rates, and on-chain transfers.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.7, ease: EASE }}
          className="mt-9 flex flex-wrap items-center gap-4"
        >
          <Button href="/contact" size="lg" magnetic>
            Join the waitlist <ArrowRight className="h-4 w-4" />
          </Button>
          <Link
            href="/how-it-works"
            className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-muted transition-colors hover:text-brand"
          >
            See how it works
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </motion.div>

        {/* the protagonist: live rate readout */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9, ease: EASE }}
          className="mt-auto pb-10 pt-16 sm:pb-12"
        >
          <div className="mb-3 flex items-center gap-3">
            <span className="index-urdu" aria-hidden>
              {toUrdu("01")}
            </span>
            <span className="h-px w-8 bg-gradient-to-r from-brand/80 to-transparent" />
            <span className="label-mono">Indicative rate · refreshes live</span>
          </div>

          <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
            <div className="font-mono text-[clamp(2.4rem,8vw,6rem)] font-medium leading-none tracking-tight text-ink">
              <span className="mr-3 align-middle text-[0.42em] text-muted">₨</span>
              <Odometer value={rate.toFixed(2)} />
            </div>
            <div className="mb-1.5 flex flex-col gap-1.5 sm:mb-3">
              <span className="font-mono text-xs text-muted">/ 1 USDT</span>
              <span
                className={
                  "font-mono text-xs " +
                  (delta >= 0 ? "text-mint" : "text-brand")
                }
              >
                {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(2)}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
