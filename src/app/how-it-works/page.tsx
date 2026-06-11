import type { Metadata } from "next";
import { JourneyContent } from "./sections";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "From creating an account to tracking your history — the full Coinsensei journey in six steps.",
};

export default function HowItWorksPage() {
  return <JourneyContent />;
}
