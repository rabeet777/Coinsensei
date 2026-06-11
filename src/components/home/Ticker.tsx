"use client";

const ITEMS = [
  "PKR ⇄ USDT",
  "Live rates",
  "On-chain transfers",
  "Verified accounts",
  "Tokenized finance",
  "Transparent history",
  "Built for Pakistan",
];

/** Ledger ticker — mono strip separated by the orbit glyph. */
export function Ticker({ reverse = false }: { reverse?: boolean }) {
  const row = (
    <>
      {ITEMS.map((t) => (
        <span key={t} className="mx-7 inline-flex items-center gap-7">
          <span className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
            {t}
          </span>
          <span aria-hidden className="text-brand/70">
            ◉
          </span>
        </span>
      ))}
    </>
  );

  return (
    <div
      aria-hidden
      className="ticker-mask relative overflow-hidden border-y border-line/50 bg-surface/40 py-3.5"
    >
      <div
        className={
          "flex w-max whitespace-nowrap " +
          (reverse ? "animate-marquee-reverse" : "animate-marquee")
        }
      >
        <div className="flex">{row}</div>
        <div className="flex">{row}</div>
      </div>
    </div>
  );
}
