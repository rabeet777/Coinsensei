import type { Metadata } from "next";
import { ResetPasswordContent } from "./sections";

export const metadata: Metadata = {
  title: "Reset your Coinsensei password",
  description:
    "Open your Coinsensei password reset link in the app to choose a new password.",
  // A one-time recovery link; never index it, and do not let the token leak
  // into a referrer when the page sends the visitor on to the app.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function ResetPasswordPage() {
  return <ResetPasswordContent />;
}
