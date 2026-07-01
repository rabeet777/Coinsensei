"use client";

import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { viewportOnce } from "@/lib/motion";

const LAST_UPDATED = "July 2, 2026";

const ADMIN_EMAIL = "admin@coinsensei.co";

type Section = {
  id: string;
  title: string;
  body: React.ReactNode;
};

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="leading-relaxed text-muted">{children}</p>
);

const List = ({ items }: { items: React.ReactNode[] }) => (
  <ul className="mt-3 space-y-2 pl-5">
    {items.map((item, i) => (
      <li key={i} className="relative leading-relaxed text-muted">
        <span
          aria-hidden
          className="absolute -left-5 top-2.5 h-1 w-1 rounded-full bg-brand"
        />
        {item}
      </li>
    ))}
  </ul>
);

const MailLink = () => (
  <a
    href={`mailto:${ADMIN_EMAIL}`}
    className="text-brand underline-offset-4 hover:underline"
  >
    {ADMIN_EMAIL}
  </a>
);

const SECTIONS: Section[] = [
  {
    id: "how-to-request",
    title: "How to request deletion",
    body: (
      <div className="space-y-4">
        <ol className="space-y-4">
          <li className="flex gap-4">
            <span className="font-mono text-sm text-brand">1</span>
            <span className="leading-relaxed text-muted">
              Email <MailLink /> from your registered email with the subject{" "}
              <span className="font-semibold text-ink">
                &ldquo;Delete My Account&rdquo;
              </span>
              .
            </span>
          </li>
          <li className="flex gap-4">
            <span className="font-mono text-sm text-brand">2</span>
            <span className="leading-relaxed text-muted">
              Include your registered email/phone so we can verify your identity.
            </span>
          </li>
        </ol>
        <P>We verify and process valid requests within 30 days.</P>
      </div>
    ),
  },
  {
    id: "before-you-delete",
    title: "Before you delete",
    body: (
      <P>
        You must withdraw any remaining crypto or PKR balance first. We cannot
        delete an account with an outstanding balance or pending transactions.
      </P>
    ),
  },
  {
    id: "what-we-delete",
    title: "What we delete",
    body: (
      <P>
        Your profile and personal data: name, contact details, saved bank
        accounts, saved wallet addresses, device information, and login/security
        data.
      </P>
    ),
  },
  {
    id: "what-we-retain",
    title: "What we retain, and for how long",
    body: (
      <div className="space-y-4">
        <P>
          As a financial services provider, we are legally required to keep
          certain records to meet anti-money-laundering (AML), know-your-customer
          (KYC), tax, and audit obligations. The following is retained for up to
          5 years after account closure, then deleted:
        </P>
        <List
          items={[
            "Identity verification (KYC) documents and records",
            "Transaction history (deposits, withdrawals, trades)",
            "Records required for legal or compliance purposes",
          ]}
        />
      </div>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <div className="border border-line bg-surface/60 p-5">
        <p className="font-display text-base font-semibold text-ink">Coinsensei</p>
        <p className="mt-2 leading-relaxed text-muted">
          Email: <MailLink />
        </p>
      </div>
    ),
  },
];

export function DeleteAccountContent() {
  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Delete Your Coinsensei Account"
        intro="Coinsensei lets you request deletion of your account and associated personal data."
      />

      <SectionWrapper width="narrow" className="!pt-10">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.5 }}
          className="label-mono text-faint"
        >
          Last updated · {LAST_UPDATED}
        </motion.p>

        <div className="mt-10 space-y-12">
          {SECTIONS.map((section, i) => (
            <motion.section
              key={section.id}
              id={section.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: 0.5, delay: 0.04 }}
              className="scroll-mt-28 border-t border-line/60 pt-8"
            >
              <div className="flex items-baseline gap-4">
                <span className="font-mono text-xs text-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">
                  {section.title}
                </h2>
              </div>
              <div className="mt-4 sm:pl-10">{section.body}</div>
            </motion.section>
          ))}
        </div>

        <p className="mt-14 border-t border-line/60 pt-6 text-xs leading-relaxed text-faint">
          For more on how we handle your information, see our{" "}
          <a
            href="/privacy-policy"
            className="text-brand underline-offset-4 hover:underline"
          >
            Privacy Policy
          </a>
          .
        </p>
      </SectionWrapper>
    </>
  );
}
