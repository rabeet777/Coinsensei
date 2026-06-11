"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type WaitlistData = {
  name: string;
  email: string;
  phone: string;
  userType: "individual" | "business";
};

const INITIAL: WaitlistData = {
  name: "",
  email: "",
  phone: "",
  userType: "individual",
};

const inputClass =
  "w-full border border-line bg-surface-2/50 px-4 py-3.5 font-sans text-sm text-ink placeholder:text-faint outline-none transition-colors focus:border-brand/70 focus:ring-1 focus:ring-brand/30";

/**
 * Waitlist form. Currently stores submissions in local state —
 * swap `submitWaitlist` for a real API call when the backend is ready.
 */
export function WaitlistForm({ className }: { className?: string }) {
  const [data, setData] = useState<WaitlistData>(INITIAL);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle"
  );

  // Replace this with: await fetch("/api/waitlist", { method: "POST", body: JSON.stringify(payload) })
  async function submitWaitlist(payload: WaitlistData) {
    await new Promise((r) => setTimeout(r, 900));
    console.info("Waitlist signup (local only):", payload);
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    await submitWaitlist(data);
    setStatus("success");
  };

  return (
    <div className={cn("relative", className)}>
      <AnimatePresence mode="wait">
        {status === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-4 py-12 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-mint/15 text-mint"
            >
              <CheckCircle2 className="h-8 w-8" />
            </motion.div>
            <h3 className="font-display text-2xl font-semibold text-ink">
              You&rsquo;re on the list
            </h3>
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              Thanks, {data.name.split(" ")[0] || "friend"}. We&rsquo;ll send
              early updates to {data.email} before Coinsensei launches.
            </p>
            <button
              onClick={() => {
                setData(INITIAL);
                setStatus("idle");
              }}
              className="mt-2 text-sm font-medium text-brand hover:underline"
            >
              Add another person
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            exit={{ opacity: 0, y: -10 }}
            className="grid gap-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-faint">
                  Name
                </span>
                <input
                  required
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  placeholder="Your full name"
                  className={inputClass}
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-faint">
                  Email
                </span>
                <input
                  required
                  type="email"
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-faint">
                  Phone number
                </span>
                <input
                  required
                  type="tel"
                  value={data.phone}
                  onChange={(e) => setData({ ...data, phone: e.target.value })}
                  placeholder="+92 300 0000000"
                  className={inputClass}
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-faint">
                  I am joining as
                </span>
                <select
                  value={data.userType}
                  onChange={(e) =>
                    setData({
                      ...data,
                      userType: e.target.value as WaitlistData["userType"],
                    })
                  }
                  className={inputClass}
                >
                  <option value="individual">Individual</option>
                  <option value="business">Business</option>
                </select>
              </label>
            </div>
            <button
              type="submit"
              disabled={status === "submitting"}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-brand px-7 py-3.5 font-semibold text-[#04141a] transition-all hover:shadow-glow-sm hover:brightness-110 disabled:opacity-70"
            >
              {status === "submitting" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Joining…
                </>
              ) : (
                "Join Waitlist"
              )}
            </button>
            <p className="text-center text-xs text-faint">
              Launching soon on Android and iOS. No spam — only launch updates.
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
