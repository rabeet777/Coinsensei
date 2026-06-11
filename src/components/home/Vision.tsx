"use client";

import { useGsap } from "@/lib/gsap";
import { toUrdu } from "@/components/ui/AnimatedHeading";

const MANIFESTO =
  "Pakistan's financial future is becoming more digital, global, and asset-backed. Coinsensei exists so anyone here can take part — converting rupees to stable digital value, moving it on-chain, and understanding every step.";

/**
 * The manifesto — a scroll-scrubbed statement. Words brighten one by
 * one as the reader moves through them, like a rate feed coming alive.
 */
export function Vision() {
  const ref = useGsap(({ gsap, el }) => {
    const words = el.querySelectorAll(".manifesto-word");
    gsap.to(words, {
      opacity: 1,
      stagger: 0.06,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "top 72%",
        end: "bottom 45%",
        scrub: 0.6,
      },
    });
  });

  return (
    <section className="relative px-5 py-20 sm:px-8 sm:py-40">
      <div aria-hidden className="absolute inset-0 line-grid opacity-30" />
      <div ref={ref} className="rails relative mx-auto max-w-5xl sm:px-10">
        <div className="mb-8 flex items-center gap-3 sm:mb-10">
          <span className="index-urdu" aria-hidden>
            {toUrdu("02")}
          </span>
          <span className="h-px w-8 bg-gradient-to-r from-brand/80 to-transparent" />
          <span className="label-mono">The vision</span>
        </div>

        <p className="font-display text-[clamp(1.5rem,4.2vw,3rem)] font-medium leading-[1.3] tracking-tight text-ink">
          {MANIFESTO.split(" ").map((w, i) => (
            <span key={i} className="manifesto-word">
              {w}&nbsp;
            </span>
          ))}
        </p>

        <p className="label-mono mt-10 text-faint sm:mt-12">
          One transaction at a time · ایک وقت میں ایک لین دین
        </p>
      </div>
    </section>
  );
}
