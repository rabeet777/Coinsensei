"use client";

import { motion } from "framer-motion";
import { MessageCircleQuestion } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { FAQAccordion } from "@/components/ui/FAQAccordion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { FAQ_ITEMS } from "@/lib/data";
import { viewportOnce } from "@/lib/motion";

export function FAQContent() {
  return (
    <>
      <PageHeader
        eyebrow="FAQ"
        title="Questions, answered clearly."
        intro="Everything you might want to know about Coinsensei — what it is, how it works, and what is coming next."
      />

      <SectionWrapper width="narrow" className="pt-8 sm:pt-12">
        <FAQAccordion items={FAQ_ITEMS} />
      </SectionWrapper>

      <SectionWrapper width="narrow" className="pt-0">
        <GlassCard className="p-10 text-center sm:p-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={viewportOnce}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-6 inline-flex h-14 w-14 items-center justify-center border border-line bg-surface-2 text-brand"
          >
            <MessageCircleQuestion className="h-6 w-6" strokeWidth={1.8} />
          </motion.div>
          <h3 className="mb-3 font-display text-2xl font-semibold text-ink">
            Still have a question?
          </h3>
          <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-muted">
            We are happy to help. Reach out to the team, or join the waitlist to
            hear about the launch first.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button href="/contact">Contact Us</Button>
            <Button href="/contact" variant="ghost">
              Join the Waitlist
            </Button>
          </div>
        </GlassCard>
      </SectionWrapper>
    </>
  );
}
