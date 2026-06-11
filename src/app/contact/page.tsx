import type { Metadata } from "next";
import { ContactContent } from "./sections";

export const metadata: Metadata = {
  title: "Contact & Waitlist",
  description:
    "Join the Coinsensei waitlist or get in touch with the team. Launching soon on Android and iOS.",
};

export default function ContactPage() {
  return <ContactContent />;
}
