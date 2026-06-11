"use client";

import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { viewportOnce } from "@/lib/motion";

const LAST_UPDATED = "June 12, 2026";

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

const SECTIONS: Section[] = [
  {
    id: "introduction",
    title: "Introduction",
    body: (
      <div className="space-y-4">
        <P>
          Coinsensei (&ldquo;Coinsensei,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo;
          or &ldquo;our&rdquo;) provides a digital asset platform that enables
          users in Pakistan to convert between Pakistani Rupee (PKR) and USDT,
          hold supported virtual assets, and make on-chain transfers through our
          website and mobile applications (together, the &ldquo;Services&rdquo;).
        </P>
        <P>
          This Privacy Policy explains what personal information we collect, how
          we use and protect it, and the choices you have. By creating an account
          or using the Services, you agree to the practices described here. If you
          do not agree, please do not use the Services.
        </P>
      </div>
    ),
  },
  {
    id: "information-we-collect",
    title: "Information We Collect",
    body: (
      <div className="space-y-4">
        <P>
          We collect information you provide directly, information generated when
          you use the Services, and information from verification and compliance
          partners.
        </P>
        <P>
          <span className="font-semibold text-ink">Account &amp; identity (KYC) data.</span>{" "}
          To meet legal and regulatory obligations, we collect your full name,
          date of birth, residential address, nationality, government-issued
          identification (such as CNIC or passport), a selfie or liveness check,
          phone number, and email address.
        </P>
        <P>
          <span className="font-semibold text-ink">Financial &amp; transaction data.</span>{" "}
          We collect bank account or payment details, wallet addresses, deposit
          and withdrawal records, conversion history, on-chain transaction
          references, and balances held on the platform.
        </P>
        <P>
          <span className="font-semibold text-ink">Technical &amp; device data.</span>{" "}
          We automatically collect device identifiers, IP address, operating
          system, app version, log data, and usage and diagnostic information.
        </P>
        <P>
          <span className="font-semibold text-ink">Communications.</span> When you
          contact support or submit a complaint, we keep the messages, attachments,
          and any information you choose to share.
        </P>
      </div>
    ),
  },
  {
    id: "how-we-use",
    title: "How We Use Your Information",
    body: (
      <List
        items={[
          "Create and operate your account and provide the Services.",
          "Process PKR ⇄ USDT conversions, deposits, withdrawals, and on-chain transfers.",
          "Verify your identity and perform KYC, AML, CFT, and sanctions screening.",
          "Detect, prevent, and investigate fraud, abuse, and security incidents.",
          "Provide customer support and respond to complaints and disputes.",
          "Comply with applicable laws, regulations, and lawful requests from authorities.",
          "Improve and secure the Services and communicate important updates.",
        ]}
      />
    ),
  },
  {
    id: "legal-basis",
    title: "Legal Basis & Compliance",
    body: (
      <div className="space-y-4">
        <P>
          We process your information to perform our contract with you, to comply
          with legal obligations applicable to financial and virtual asset
          services in Pakistan (including anti-money-laundering and
          counter-financing-of-terrorism requirements), to pursue our legitimate
          interests in operating a safe platform, and, where required, with your
          consent.
        </P>
        <P>
          As a regulated category of service, certain KYC and transaction records
          must be collected and retained, and we may be required to provide them
          to regulators, financial intelligence units, or law-enforcement
          authorities.
        </P>
      </div>
    ),
  },
  {
    id: "how-we-share",
    title: "How We Share Information",
    body: (
      <div className="space-y-4">
        <P>We do not sell your personal information. We share it only as needed:</P>
        <List
          items={[
            "With identity-verification, fraud-prevention, and payment-processing partners who help us deliver the Services.",
            "With banks and financial institutions to settle fiat deposits and withdrawals.",
            "With regulators, tax authorities, courts, and law enforcement where required by law or to protect our users and platform.",
            "With professional advisers (such as auditors and legal counsel) under confidentiality obligations.",
            "In connection with a merger, acquisition, or reorganisation, subject to this Policy.",
          ]}
        />
      </div>
    ),
  },
  {
    id: "blockchain",
    title: "Blockchain & On-Chain Data",
    body: (
      <P>
        On-chain transactions are recorded on public blockchains and are, by their
        nature, permanent and visible to anyone. Wallet addresses and transaction
        amounts cannot be deleted or altered once confirmed. You should consider
        the public nature of blockchain data before initiating transfers.
      </P>
    ),
  },
  {
    id: "security",
    title: "Data Security",
    body: (
      <P>
        We use administrative, technical, and physical safeguards — including
        encryption in transit, access controls, and monitoring — to protect your
        information. No method of transmission or storage is completely secure, so
        we cannot guarantee absolute security. Please keep your credentials, PIN,
        and two-factor authentication confidential.
      </P>
    ),
  },
  {
    id: "retention",
    title: "Data Retention",
    body: (
      <P>
        We retain personal and transaction data for as long as your account is
        active and for the period required by applicable financial and AML/CFT
        regulations after closure (typically several years). When data is no longer
        required, we delete or anonymise it.
      </P>
    ),
  },
  {
    id: "your-rights",
    title: "Your Rights & Choices",
    body: (
      <div className="space-y-4">
        <P>Subject to applicable law and our regulatory obligations, you may:</P>
        <List
          items={[
            "Access and request a copy of the personal information we hold about you.",
            "Request correction of inaccurate or incomplete information.",
            "Request deletion of your data, subject to mandatory retention requirements.",
            "Object to or restrict certain processing, and withdraw consent where processing is based on consent.",
          ]}
        />
        <P>
          To exercise these rights, contact us using the details below. We may need
          to verify your identity before acting on a request.
        </P>
      </div>
    ),
  },
  {
    id: "account-deletion",
    title: "Account Deletion",
    body: (
      <P>
        You can request deletion of your account at any time by contacting{" "}
        <a
          href="mailto:admin@coinsensei.co"
          className="text-brand underline-offset-4 hover:underline"
        >
          admin@coinsensei.co
        </a>{" "}
        or through the in-app support channel. We will close your account and delete
        or anonymise your personal data, except records we are legally required to
        retain for compliance, audit, or dispute-resolution purposes. Any remaining
        balance must be withdrawn before deletion.
      </P>
    ),
  },
  {
    id: "cookies",
    title: "Cookies & Tracking",
    body: (
      <P>
        Our website and apps use cookies and similar technologies to keep you signed
        in, remember preferences, measure performance, and improve the Services. You
        can control cookies through your browser or device settings, though some
        features may not work properly if disabled.
      </P>
    ),
  },
  {
    id: "children",
    title: "Children's Privacy",
    body: (
      <P>
        The Services are intended for users aged 18 and over. We do not knowingly
        collect personal information from minors. If we learn that we have collected
        data from a person under 18, we will delete it and close any associated
        account.
      </P>
    ),
  },
  {
    id: "international-transfers",
    title: "International Data Transfers",
    body: (
      <P>
        Some of our service providers may process data outside Pakistan. Where this
        happens, we take steps to ensure your information receives an appropriate
        level of protection consistent with this Policy and applicable law.
      </P>
    ),
  },
  {
    id: "changes",
    title: "Changes to This Policy",
    body: (
      <P>
        We may update this Privacy Policy from time to time. When we make material
        changes, we will update the &ldquo;Last updated&rdquo; date and, where
        appropriate, notify you in the app or by email. Your continued use of the
        Services after changes take effect constitutes acceptance of the updated
        Policy.
      </P>
    ),
  },
  {
    id: "contact",
    title: "Contact Us",
    body: (
      <div className="space-y-4">
        <P>
          If you have questions, requests, or complaints about this Privacy Policy
          or your data, contact us at:
        </P>
        <div className="border border-line bg-surface/60 p-5">
          <p className="font-display text-base font-semibold text-ink">Coinsensei</p>
          <p className="mt-2 leading-relaxed text-muted">
            Email:{" "}
            <a
              href="mailto:admin@coinsensei.co"
              className="text-brand underline-offset-4 hover:underline"
            >
              admin@coinsensei.co
            </a>
            <br />
            Pakistan
          </p>
        </div>
      </div>
    ),
  },
];

export function PrivacyPolicyContent() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        intro="This policy explains how Coinsensei collects, uses, protects, and shares your information across our PKR ⇄ USDT platform and mobile apps."
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
          This Privacy Policy is provided for general information and to support
          app-store and regulatory submissions. It is not legal advice; we
          recommend review by qualified counsel before publication.
        </p>
      </SectionWrapper>
    </>
  );
}
