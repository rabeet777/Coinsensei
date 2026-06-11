import type { Metadata } from "next";
import { FeaturesContent } from "./sections";

export const metadata: Metadata = {
  title: "Features",
  description:
    "PKR ⇄ USDT conversion, live rates, on-chain transfers, transaction history, verification, secure withdrawals, and a mobile-first experience.",
};

export default function FeaturesPage() {
  return <FeaturesContent />;
}
