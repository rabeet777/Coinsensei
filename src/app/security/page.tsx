import type { Metadata } from "next";
import { SecurityContent } from "./sections";

export const metadata: Metadata = {
  title: "Security",
  description:
    "Coinsensei is designed with security and transparency in mind — verification flows, transaction tracking, monitored withdrawals, and clear activity history.",
};

export default function SecurityPage() {
  return <SecurityContent />;
}
