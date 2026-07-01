import type { Metadata } from "next";
import { DeleteAccountContent } from "./sections";

export const metadata: Metadata = {
  title: "Delete Your Coinsensei Account",
  description:
    "How to request deletion of your Coinsensei account and personal data, what we delete, and which KYC, transaction, and compliance records we are legally required to retain.",
};

export default function DeleteAccountPage() {
  return <DeleteAccountContent />;
}
