import type { Metadata } from "next";
import { FAQContent } from "./sections";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to common questions about Coinsensei — PKR ⇄ USDT conversion, on-chain transfers, virtual assets, tokenization, and the upcoming launch.",
};

export default function FAQPage() {
  return <FAQContent />;
}
