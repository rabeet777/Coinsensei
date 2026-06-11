import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionWrapperProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  width?: "default" | "wide" | "narrow";
  /** Draw the ledger rails (vertical hairlines) on this section. */
  rails?: boolean;
};

/** Consistent vertical rhythm + max-width; sections read as ledger blocks. */
export function SectionWrapper({
  children,
  className,
  id,
  width = "default",
  rails = true,
}: SectionWrapperProps) {
  return (
    <section
      id={id}
      className={cn("relative px-5 py-16 sm:px-8 sm:py-32", className)}
    >
      <div
        className={cn(
          "mx-auto",
          rails && "rails px-0 sm:px-10",
          width === "default" && "max-w-6xl",
          width === "wide" && "max-w-7xl",
          width === "narrow" && "max-w-3xl"
        )}
      >
        {children}
      </div>
    </section>
  );
}
