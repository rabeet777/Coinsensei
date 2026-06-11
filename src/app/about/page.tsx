import type { Metadata } from "next";
import { AboutContent } from "./sections";

export const metadata: Metadata = {
  title: "About",
  description:
    "Coinsensei is building a modern digital asset platform for Pakistan — making virtual asset access simpler, safer, and easier to understand.",
};

export default function AboutPage() {
  return <AboutContent />;
}
