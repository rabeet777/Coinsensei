"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Button } from "@/components/ui/Button";
import { viewportOnce } from "@/lib/motion";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.coinsensei.app";

/** Must match PASSWORD_RESET_DEEP_LINK_PREFIX in the app's config/authRedirect.ts. */
const APP_DEEP_LINK = "coinsensei://reset-password";

type LinkState =
  | { kind: "checking" }
  | { kind: "handoff"; target: string }
  | { kind: "expired"; detail: string | null }
  | { kind: "missing" };

/**
 * Supabase puts recovery credentials in the URL fragment (implicit flow:
 * `#access_token=...&type=recovery`) or the query string (PKCE: `?code=...`),
 * and reports problems as `#error=...&error_description=...`.
 *
 * Read both, and never log or render the token itself.
 */
function readRecoveryParams(): LinkState {
  if (typeof window === "undefined") return { kind: "checking" };

  const hash = window.location.hash.replace(/^#/, "");
  const query = window.location.search.replace(/^\?/, "");
  const fromHash = new URLSearchParams(hash);
  const fromQuery = new URLSearchParams(query);

  const error = fromHash.get("error") || fromQuery.get("error");
  if (error) {
    const detail =
      fromHash.get("error_description") || fromQuery.get("error_description");
    return { kind: "expired", detail: detail ? detail.replace(/\+/g, " ") : null };
  }

  const hasImplicit =
    fromHash.get("access_token") && fromHash.get("type") === "recovery";
  if (hasImplicit) {
    return { kind: "handoff", target: `${APP_DEEP_LINK}#${hash}` };
  }

  const code = fromQuery.get("code");
  if (code) {
    return { kind: "handoff", target: `${APP_DEEP_LINK}?${query}` };
  }

  return { kind: "missing" };
}

export function ResetPasswordContent() {
  const [state, setState] = useState<LinkState>({ kind: "checking" });
  const [handoffTried, setHandoffTried] = useState(false);

  useEffect(() => {
    const read = () => setState(readRecoveryParams());
    read();
    // Arriving from an email is a fresh load, but some mail and in-app
    // browsers rewrite only the fragment, which would otherwise leave this
    // showing a stale state.
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const openInApp = useCallback(() => {
    if (state.kind !== "handoff") return;
    setHandoffTried(true);
    try {
      window.location.href = state.target;
    } catch {
      // No app installed; the instructions below are the fallback.
    }
  }, [state]);

  // Hand straight off to the app. On Android and iOS the link usually opens
  // the app before this runs — this covers the case where the OS did not
  // claim the URL (app-link verification pending, link opened in an in-app
  // browser, etc.).
  useEffect(() => {
    if (state.kind !== "handoff") return;
    const timer = setTimeout(openInApp, 600);
    return () => clearTimeout(timer);
  }, [state, openInApp]);

  return (
    <>
      <PageHeader
        eyebrow="Account recovery"
        title="Reset your password"
        intro="Your reset link opens in the Coinsensei app, where you can choose a new password."
      />

      <SectionWrapper width="narrow">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {state.kind === "checking" && (
            <p className="text-base text-muted">Checking your link…</p>
          )}

          {state.kind === "handoff" && (
            <div className="space-y-6">
              <p className="text-base leading-relaxed text-muted">
                {handoffTried
                  ? "If the app did not open, tap the button below."
                  : "Opening the Coinsensei app…"}
              </p>

              <div className="flex flex-wrap gap-3">
                <Button onClick={openInApp} variant="primary" size="lg">
                  Open in the Coinsensei app
                </Button>
              </div>

              <div className="space-y-2 border-t border-line/60 pt-6 text-sm text-muted">
                <p className="font-medium text-ink">
                  Nothing happened?
                </p>
                <p>
                  This link only works on the phone where Coinsensei is
                  installed. If you opened it on a computer, open the same email
                  on your phone instead.
                </p>
                <p>
                  Don&apos;t have the app yet?{" "}
                  <a
                    href={PLAY_STORE_URL}
                    className="underline underline-offset-4 hover:text-ink"
                  >
                    Get Coinsensei on Google Play
                  </a>
                  , then open the link again.
                </p>
                <p>
                  For your security the link can only be used once, and it
                  expires shortly after it is sent.
                </p>
              </div>
            </div>
          )}

          {state.kind === "expired" && (
            <div className="space-y-4">
              <p className="text-base leading-relaxed text-muted">
                This password reset link is no longer valid. Reset links expire
                shortly after they are sent and can only be used once.
              </p>
              {state.detail && (
                <p className="font-mono text-sm text-muted">
                  {state.detail}
                </p>
              )}
              <p className="text-base leading-relaxed text-muted">
                Open the Coinsensei app, tap{" "}
                <span className="text-ink">Forgot password</span> on the
                sign-in screen, and request a new link.
              </p>
            </div>
          )}

          {state.kind === "missing" && (
            <div className="space-y-4">
              <p className="text-base leading-relaxed text-muted">
                This page is only reachable from a password reset email. It
                looks like the link was incomplete — some mail apps shorten long
                links.
              </p>
              <p className="text-base leading-relaxed text-muted">
                Open the Coinsensei app, tap{" "}
                <span className="text-ink">Forgot password</span> on the
                sign-in screen, and request a new link. If it keeps happening,
                try opening the email in a different mail app.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button href="/contact" variant="outline" size="lg">
                  Contact support
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </SectionWrapper>
    </>
  );
}
