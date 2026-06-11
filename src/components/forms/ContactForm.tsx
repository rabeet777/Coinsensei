"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";

const inputClass =
  "w-full border border-line bg-surface-2/50 px-4 py-3.5 font-sans text-sm text-ink placeholder:text-faint outline-none transition-colors focus:border-brand/70 focus:ring-1 focus:ring-brand/30";

/** General contact / business inquiry form (local state for now). */
export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle"
  );
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: "general",
    message: "",
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    // Replace with a real API call when available.
    await new Promise((r) => setTimeout(r, 900));
    console.info("Contact message (local only):", form);
    setStatus("success");
  };

  return (
    <AnimatePresence mode="wait">
      {status === "success" ? (
        <motion.div
          key="done"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-3 py-12 text-center"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-mint/15 text-mint">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h3 className="font-display text-xl font-semibold text-ink">
            Message sent
          </h3>
          <p className="max-w-sm text-sm text-muted">
            Thanks for reaching out. We typically reply within 24–48 hours.
          </p>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          onSubmit={handleSubmit}
          exit={{ opacity: 0, y: -10 }}
          className="grid gap-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your name"
              aria-label="Your name"
              className={inputClass}
            />
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              aria-label="Email"
              className={inputClass}
            />
          </div>
          <select
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            aria-label="Topic"
            className={inputClass}
          >
            <option value="general">General question</option>
            <option value="business">Business inquiry</option>
            <option value="press">Press / media</option>
            <option value="support">Support</option>
          </select>
          <textarea
            required
            rows={5}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="How can we help?"
            aria-label="Message"
            className={inputClass}
          />
          <button
            type="submit"
            disabled={status === "submitting"}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-line px-7 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-brand/60 hover:text-brand disabled:opacity-70"
          >
            {status === "submitting" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              "Send message"
            )}
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
