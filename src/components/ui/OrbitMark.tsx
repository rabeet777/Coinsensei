import { cn } from "@/lib/utils";

/**
 * Signature motif: the Coinsensei "C and dot" rendered as an orbital ring.
 * Used as a decorative element across sections.
 */
export function OrbitMark({
  className,
  size = 220,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      className={cn("animate-spin-slow", className)}
    >
      <circle
        cx="100"
        cy="100"
        r="78"
        stroke="rgb(var(--brand) / 0.35)"
        strokeWidth="2"
        strokeDasharray="300 90"
        strokeLinecap="round"
      />
      <circle
        cx="100"
        cy="100"
        r="52"
        stroke="rgb(var(--line) / 0.9)"
        strokeWidth="1"
        strokeDasharray="3 8"
      />
      <circle cx="100" cy="100" r="9" fill="rgb(var(--brand) / 0.8)" />
      <circle cx="178" cy="100" r="4" fill="rgb(var(--mint) / 0.8)" />
    </svg>
  );
}
