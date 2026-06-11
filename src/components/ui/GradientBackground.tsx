import { cn } from "@/lib/utils";

/**
 * Layered ambient background: dark gradient wash, dotted token grid,
 * and two slow light beams. Pure CSS — cheap to render.
 */
export function GradientBackground({
  className,
  grid = "dots",
}: {
  className?: string;
  grid?: "dots" | "lines" | "none";
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
    >
      <div className="absolute inset-0 bg-hero-gradient" />
      {grid === "dots" && <div className="absolute inset-0 token-grid" />}
      {grid === "lines" && <div className="absolute inset-0 line-grid" />}
      <div className="beam left-[8%] animate-beam-sweep" />
      <div
        className="beam left-[40%] animate-beam-sweep"
        style={{ animationDelay: "3.2s" }}
      />
    </div>
  );
}
