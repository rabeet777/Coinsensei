"use client";

import { useGsap } from "@/lib/gsap";
import { AnimatedHeading } from "@/components/ui/AnimatedHeading";
import { PhoneMockup } from "@/components/mockups/PhoneMockup";

const SCREENS = [
  {
    screen: "/app/06-P2P-Buy-USDT-Calculator.png",
    tag: "Convert",
    title: "PKR → USDT with a live rate",
    text: "Enter rupees, see exactly what you'll receive — rate and total shown before you confirm.",
  },
  {
    screen: "/app/03-Home-Dashboard-QuickActions.png",
    tag: "Track",
    title: "One portfolio, updated live",
    text: "Your PKR and USDT balances in a single view that refreshes every thirty seconds.",
  },
  {
    screen: "/app/09-Transaction-History-Crypto.png",
    tag: "Transfer",
    title: "On-chain, with receipts",
    text: "Send USDT across supported networks. Every movement gets a status and a hash.",
  },
  {
    screen: "/app/12-Security-Settings.png",
    tag: "Protect",
    title: "Verification built in",
    text: "Two-factor authentication, biometric sign-in, and device management from day one.",
  },
];

/**
 * The product, walked end-to-end: a GSAP-pinned horizontal gallery.
 * The section locks while real app screens slide past like a filmstrip.
 */
export function ProductIntro() {
  const ref = useGsap(({ gsap, el }) => {
    const track = el.querySelector<HTMLElement>("[data-track]");
    if (!track) return;
    const distance = () => track.scrollWidth - el.clientWidth;

    gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "top top",
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.7,
        invalidateOnRefresh: true,
      },
    });
  });

  return (
    <section className="relative border-y border-line/50">
      {/* Heading block above the pinned strip */}
      <div className="rails mx-auto max-w-6xl px-5 pb-4 pt-16 sm:px-12 sm:pt-32">
        <AnimatedHeading index="04" eyebrow="The first product">
          Starting with what Pakistan needs most: simple PKR and USDT access.
        </AnimatedHeading>
        <p className="label-mono text-faint">Scroll — the app walks itself ↓</p>
      </div>

      <div ref={ref} className="relative h-[100svh] overflow-hidden">
        <div
          data-track
          className="flex h-full items-center gap-[6vw] pl-[8vw] pr-[14vw]"
        >
          {SCREENS.map((s, i) => (
            <article
              key={s.screen}
              className="flex w-[78vw] shrink-0 items-center gap-8 sm:w-[58vw] lg:w-[44vw]"
            >
              <div className="hidden w-1/2 sm:block">
                <p className="label-mono mb-4 text-brand">
                  {String(i + 1).padStart(2, "0")} / {s.tag}
                </p>
                <h3 className="font-display text-xl font-semibold leading-snug text-ink sm:text-2xl">
                  {s.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {s.text}
                </p>
              </div>
              <div className="mx-auto w-2/3 max-w-[260px] sm:w-1/2">
                <PhoneMockup screen={s.screen} alt={s.title} />
                <div className="mt-4 sm:hidden">
                  <p className="label-mono mb-1.5 text-brand">{s.tag}</p>
                  <p className="text-sm text-muted">{s.title}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* progress hairline */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-10 mx-auto h-px max-w-5xl bg-line/60"
        />
      </div>
    </section>
  );
}
