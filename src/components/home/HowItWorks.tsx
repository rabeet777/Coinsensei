"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { AnimatedHeading } from "@/components/ui/AnimatedHeading";
import { PhoneMockup } from "@/components/mockups/PhoneMockup";
import { StepCard } from "./StepCard";
import { HOME_STEPS } from "@/lib/data";

/**
 * Interactive stepper: the phone screen swaps as each step is selected,
 * and a progress line animates in as the section scrolls into view.
 */
export function HowItWorks() {
  const [active, setActive] = useState(0);

  return (
    <SectionWrapper width="wide">
      <div className="mx-auto max-w-3xl text-center">
        <AnimatedHeading index="07" eyebrow="How it works" align="center">
          Start your digital asset journey in a few steps.
        </AnimatedHeading>
      </div>

      <div className="mt-9 grid items-start gap-10 sm:mt-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
        <div className="flex flex-col">
          {HOME_STEPS.map((step, i) => (
            <StepCard
              key={step.title}
              step={step}
              index={i}
              active={active === i}
              completed={i < active}
              isLast={i === HOME_STEPS.length - 1}
              onActivate={() => setActive(i)}
            />
          ))}
        </div>

        <div className="sticky top-28 mx-auto hidden w-full max-w-xs lg:block">
          <AnimatePresence mode="wait">
            <motion.div
              key={HOME_STEPS[active].screen}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <PhoneMockup
                screen={HOME_STEPS[active].screen}
                alt={HOME_STEPS[active].title}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </SectionWrapper>
  );
}
