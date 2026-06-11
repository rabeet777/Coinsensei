"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type PhoneMockupProps = {
  screen: string;
  alt: string;
  className?: string;
  priority?: boolean;
  /** Soft glow plinth behind the device. */
  glow?: boolean;
};

/**
 * Real device screenshot (transparent PNG, stored in
 * /public/Clean_Screenshots). The device floats on the obsidian
 * surface with an optional flow-glow plinth — no extra frame chrome.
 */
export function PhoneMockup({
  screen,
  alt,
  className,
  priority,
  glow = true,
}: PhoneMockupProps) {
  const clean = screen.replace("/app/", "/Clean_Screenshots/");
  return (
    <div className={cn("relative", className)}>
      {glow && (
        <div
          aria-hidden
          className="absolute -inset-10 -z-10"
          style={{
            background:
              "radial-gradient(60% 55% at 50% 45%, rgb(var(--brand) / 0.16), transparent 70%), radial-gradient(45% 40% at 60% 70%, rgb(var(--mint) / 0.10), transparent 70%)",
            filter: "blur(28px)",
          }}
        />
      )}
      <Image
        src={clean}
        alt={alt}
        width={420}
        height={870}
        priority={priority}
        className="h-auto w-full select-none drop-shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
      />
    </div>
  );
}
