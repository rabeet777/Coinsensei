import type { Metadata } from "next";
import { PrivacyPolicyContent } from "./sections";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Coinsensei collects, uses, protects, and shares your personal and transaction data across our PKR ⇄ USDT platform, mobile apps, and KYC processes.",
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyContent />;
}
