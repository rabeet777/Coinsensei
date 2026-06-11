import { type ClassValue } from "./cn-types";

/** Tiny class join helper (avoids extra deps). */
export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flat(Infinity as 1)
    .filter((x): x is string => typeof x === "string" && x.length > 0)
    .join(" ");
}
