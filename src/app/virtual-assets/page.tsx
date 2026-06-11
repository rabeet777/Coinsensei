import type { Metadata } from "next";
import { VirtualAssetsContent } from "./sections";

export const metadata: Metadata = {
  title: "Virtual Assets",
  description:
    "Understand virtual assets, tokenization, and why they matter for Pakistan — and where Coinsensei fits in.",
};

export default function VirtualAssetsPage() {
  return <VirtualAssetsContent />;
}
