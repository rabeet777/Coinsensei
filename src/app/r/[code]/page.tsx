import type { Metadata } from "next";
import { ReferralContent } from "./sections";

type Props = { params: { code: string } };

/**
 * Referral codes are 8 characters from an unambiguous alphabet (no 0/O/1/I/L).
 * Anything else is treated as "no code" so a mistyped link still renders a
 * usable signup page instead of echoing arbitrary text back to the visitor.
 */
function sanitizeCode(raw: string): string {
  return (raw ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
}

export function generateMetadata({ params }: Props): Metadata {
  const code = sanitizeCode(params.code);
  return {
    title: code ? `Join Coinsensei with code ${code}` : "Join Coinsensei",
    description:
      "Your friend invited you to Coinsensei — Pakistan's crypto wallet and P2P exchange. Sign up with their referral code, verify your identity and make your first PKR deposit.",
    // Per-code pages carry no unique content worth indexing.
    robots: { index: false, follow: true },
  };
}

export default function ReferralPage({ params }: Props) {
  return <ReferralContent code={sanitizeCode(params.code)} />;
}
