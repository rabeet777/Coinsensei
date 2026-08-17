"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Button } from "@/components/ui/Button";
import { viewportOnce } from "@/lib/motion";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.coinsensei.app";

const STEPS: { title: string; body: string }[] = [
  {
    title: "Get the app and sign up",
    body: "Download Coinsensei and create your account. Enter the referral code below during signup — if you opened this page on your phone, it is filled in for you automatically.",
  },
  {
    title: "Verify your identity",
    body: "Complete KYC verification with your CNIC. This is required before you can deposit or trade, and it is what keeps the platform compliant.",
  },
  {
    title: "Make your first PKR deposit",
    body: "Fund your account from your Pakistani bank. Once your deposit is approved, your friend's referral reward is unlocked.",
  },
];

export function ReferralContent({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  // If the app is already installed, hand the code straight to it. Browsers
  // that cannot resolve the scheme simply stay on this page.
  useEffect(() => {
    if (!code) return;
    const timer = setTimeout(() => {
      try {
        window.location.href = `coinsensei://referral?code=${encodeURIComponent(code)}`;
      } catch {
        // No app installed — the page below is the fallback.
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [code]);

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — the code is visible on screen to type manually.
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Invitation"
        title={code ? "You've been invited to Coinsensei" : "Join Coinsensei"}
        intro="Pakistan's crypto wallet and P2P exchange. Buy, sell and store USDT, and trade in PKR with verified users."
      />

      <SectionWrapper width="narrow" className="!pt-10">
        {code ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-line/60 bg-surface-2/40 p-6 text-center sm:p-8"
          >
            <p className="label-mono text-faint">Your referral code</p>
            <p className="mt-3 font-mono text-4xl font-bold tracking-[0.35em] text-ink sm:text-5xl">
              {code}
            </p>
            <button
              type="button"
              onClick={copy}
              className="mt-5 rounded-full border border-line/60 px-5 py-2 text-sm font-semibold text-brand transition hover:border-brand/50 hover:bg-brand/5"
            >
              {copied ? "Copied ✓" : "Copy code"}
            </button>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Enter this code when you sign up so your friend gets credited.
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-line/60 bg-surface-2/40 p-6 text-center sm:p-8"
          >
            <p className="leading-relaxed text-muted">
              That referral link doesn&apos;t look valid. You can still create an account — just ask your friend
              for their referral code and enter it during signup.
            </p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          <Button href={PLAY_STORE_URL} variant="primary">
            Get it on Google Play
          </Button>
          <Button href="/how-it-works" variant="outline">
            How Coinsensei works
          </Button>
        </motion.div>

        <div className="mt-14 space-y-10">
          {STEPS.map((step, i) => (
            <motion.section
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.5, delay: 0.04 }}
              className="border-t border-line/60 pt-8"
            >
              <div className="flex items-baseline gap-4">
                <span className="font-mono text-xs text-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">
                  {step.title}
                </h2>
              </div>
              <p className="mt-4 leading-relaxed text-muted sm:pl-10">{step.body}</p>
            </motion.section>
          ))}
        </div>

        <p className="mt-14 border-t border-line/60 pt-6 text-xs leading-relaxed text-faint">
          Referral rewards are paid to the person who invited you, once your identity verification and first PKR
          deposit are approved. Coinsensei may change or end the referral programme at any time, and may withhold
          rewards where activity appears fraudulent or abusive. See our{" "}
          <a href="/privacy-policy" className="text-brand underline-offset-4 hover:underline">
            Privacy Policy
          </a>{" "}
          for how we handle your information.
        </p>
      </SectionWrapper>
    </>
  );
}
