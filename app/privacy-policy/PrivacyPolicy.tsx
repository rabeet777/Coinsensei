'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import { APP_LINKS } from '@/lib/constants';

// ── Privacy Policy Sections Data ───────────────────────────────
type Section = {
  id: string;
  icon: string;
  title: string;
  intro: string;
  body?: string[];
  bullets?: { icon: string; title: string; desc: string }[];
  faqs?: { q: string; a: string }[];
};

const LAST_UPDATED = 'May 18, 2026';
const EFFECTIVE_DATE = 'May 21, 2026';

const HIGHLIGHTS = [
  {
    icon: 'block',
    color: 'bg-rose-100 text-rose-600',
    title: 'We never sell your data',
    desc: 'Your personal information is never sold or rented to advertisers or third parties.',
  },
  {
    icon: 'shield_lock',
    color: 'bg-[--color-primary]/10 text-[--color-primary]',
    title: 'Bank-grade encryption',
    desc: 'All data in transit and at rest is protected with TLS 1.3 and AES-256 encryption.',
  },
  {
    icon: 'visibility_off',
    color: 'bg-purple-100 text-purple-600',
    title: 'Minimal data collection',
    desc: 'We only collect what we need to deliver our exchange service and meet regulations.',
  },
  {
    icon: 'task_alt',
    color: 'bg-green-100 text-green-600',
    title: 'You stay in control',
    desc: 'Access, correct, export, or delete your data at any time through our support team.',
  },
];

const SECTIONS: Section[] = [
  {
    id: 'introduction',
    icon: 'waving_hand',
    title: '1. Introduction',
    intro:
      'CoinSensei ("CoinSensei", "we", "us", or "our") is committed to protecting the privacy and security of every customer who uses our USDT-to-PKR exchange platform. This Privacy Policy explains how we collect, use, store, share, and protect your personal information when you visit our website, use the CoinSensei mobile app, or interact with our support team.',
    body: [
      'By accessing or using our services, you confirm that you have read, understood, and agreed to the practices described in this Privacy Policy. If you do not agree, please do not use our services.',
      'This policy is written in plain English so you can clearly understand your rights. We have also published an Urdu summary upon request — please contact support@coinsensei.com for a copy.',
    ],
  },
  {
    id: 'information-we-collect',
    icon: 'inventory_2',
    title: '2. Information We Collect',
    intro:
      'We collect only the information that is necessary to provide a secure, compliant, and reliable exchange service. The categories of information we collect are listed below.',
    bullets: [
      {
        icon: 'person',
        title: 'Identity Information',
        desc: 'Full name, date of birth, nationality, CNIC or passport number, and a selfie verification — collected only as required by Pakistan KYC/AML regulations.',
      },
      {
        icon: 'contact_mail',
        title: 'Contact Information',
        desc: 'Email address, mobile phone number, and residential address. Used for account communication, transaction confirmations, and customer support.',
      },
      {
        icon: 'account_balance',
        title: 'Financial Information',
        desc: 'Bank account or mobile-wallet details (HBL, Meezan, Easypaisa, JazzCash, etc.) and USDT wallet addresses you use for trades.',
      },
      {
        icon: 'swap_horiz',
        title: 'Transaction Data',
        desc: 'Trade amounts, timestamps, exchange rates, and unique transaction IDs — required for record-keeping, AML compliance, and dispute resolution.',
      },
      {
        icon: 'devices',
        title: 'Device & Technical Data',
        desc: 'IP address, device model, operating system, browser type, language settings, and app diagnostic logs used for fraud prevention and quality assurance.',
      },
      {
        icon: 'forum',
        title: 'Support & Communication Data',
        desc: 'Messages, chat transcripts, screenshots, and call recordings you share when contacting our support team.',
      },
    ],
  },
  {
    id: 'how-we-use',
    icon: 'task',
    title: '3. How We Use Your Information',
    intro:
      'Your data powers a faster, safer trading experience. We only use it for the purposes listed below, and we never use it for unsolicited advertising.',
    body: [
      'To verify your identity and comply with Pakistan KYC, AML, and CFT obligations.',
      'To process your USDT-to-PKR or PKR-to-USDT trade requests and credit funds to your bank or wallet.',
      'To detect, prevent, and investigate fraud, scams, money laundering, and unauthorised account access.',
      'To provide responsive customer support in English and Urdu.',
      'To improve the CoinSensei app, fix bugs, and add the features customers ask for.',
      'To send essential service announcements such as security alerts, downtime notices, and policy updates.',
      'To comply with court orders, regulatory directives, or other valid legal requests.',
    ],
  },
  {
    id: 'legal-basis',
    icon: 'gavel',
    title: '4. Legal Basis for Processing',
    intro:
      'Depending on the activity, we process your data under one of the following legal grounds:',
    bullets: [
      {
        icon: 'handshake',
        title: 'Contract',
        desc: 'To deliver the exchange service you signed up for, including processing trades and refunds.',
      },
      {
        icon: 'verified_user',
        title: 'Legal obligation',
        desc: 'To meet KYC/AML laws, tax reporting, and other Pakistan regulatory requirements.',
      },
      {
        icon: 'security',
        title: 'Legitimate interests',
        desc: 'To keep our platform secure, prevent fraud, and improve the customer experience.',
      },
      {
        icon: 'check_circle',
        title: 'Consent',
        desc: 'For optional features like marketing emails or product surveys — you can withdraw consent at any time.',
      },
    ],
  },
  {
    id: 'data-sharing',
    icon: 'share',
    title: '5. Sharing & Disclosure',
    intro:
      'We do not sell, rent, or trade your personal information. We only share information with carefully vetted parties when strictly necessary:',
    bullets: [
      {
        icon: 'fact_check',
        title: 'KYC & Identity Verification Providers',
        desc: 'Trusted partners that help us verify your CNIC, selfie, and address documents securely.',
      },
      {
        icon: 'account_balance_wallet',
        title: 'Banking & Payment Partners',
        desc: 'Banks and mobile-wallet providers (HBL, Meezan, Easypaisa, JazzCash) involved in PKR transfers.',
      },
      {
        icon: 'cloud',
        title: 'Infrastructure & Cloud Providers',
        desc: 'Tier-1 cloud and security providers (e.g. AWS, Cloudflare) that host our app under strict data-processing agreements.',
      },
      {
        icon: 'balance',
        title: 'Regulators & Law Enforcement',
        desc: 'When compelled by Pakistan law, court order, or written FIA/SBP request — we will always verify legitimacy before disclosure.',
      },
      {
        icon: 'business',
        title: 'Corporate Transactions',
        desc: 'If CoinSensei merges, restructures, or is acquired, your data may transfer to the successor entity — bound by this Privacy Policy.',
      },
    ],
  },
  {
    id: 'cookies',
    icon: 'cookie',
    title: '6. Cookies & Tracking Technologies',
    intro:
      'Our website uses minimal cookies and similar technologies to keep your session secure and to understand how customers use our service. You can disable non-essential cookies any time from your browser settings.',
    bullets: [
      {
        icon: 'lock',
        title: 'Strictly Necessary',
        desc: 'Required for login, secure trading sessions, and remembering your preferences.',
      },
      {
        icon: 'insights',
        title: 'Performance & Analytics',
        desc: 'Aggregated, anonymous usage statistics that help us improve page speed and fix bugs.',
      },
      {
        icon: 'campaign',
        title: 'Marketing (Optional)',
        desc: 'Only set with your explicit consent — used to measure the effectiveness of our campaigns.',
      },
    ],
  },
  {
    id: 'security',
    icon: 'security',
    title: '7. How We Protect Your Data',
    intro:
      'Security is the foundation of CoinSensei. We use defence-in-depth strategies to protect your personal information against unauthorised access, alteration, or loss.',
    bullets: [
      {
        icon: 'enhanced_encryption',
        title: 'Encryption Everywhere',
        desc: 'TLS 1.3 for data in transit, AES-256 for data at rest, and HSM-protected keys for sensitive secrets.',
      },
      {
        icon: 'admin_panel_settings',
        title: 'Strict Access Controls',
        desc: 'Role-based access, multi-factor authentication, and full audit trails for every employee action.',
      },
      {
        icon: 'monitoring',
        title: '24/7 Security Monitoring',
        desc: 'Automated alerting and human review for any suspicious activity on customer accounts.',
      },
      {
        icon: 'bug_report',
        title: 'Regular Audits & Pen-Tests',
        desc: 'Independent security audits and penetration tests performed periodically by external experts.',
      },
    ],
  },
  {
    id: 'retention',
    icon: 'schedule',
    title: '8. Data Retention',
    intro:
      'We keep your information only for as long as necessary to deliver our service and to meet legal obligations.',
    body: [
      'KYC documents and transaction records are retained for at least five (5) years after the closure of your account, as required by Pakistan AML regulations.',
      'Communication and support records are retained for up to three (3) years for quality assurance and dispute resolution.',
      'Marketing preferences are retained until you withdraw consent.',
      'After the retention period, your data is securely deleted or irreversibly anonymised.',
    ],
  },
  {
    id: 'your-rights',
    icon: 'account_circle',
    title: '9. Your Rights',
    intro:
      'You have full control over your personal data. You can exercise the following rights at any time:',
    bullets: [
      {
        icon: 'visibility',
        title: 'Right to Access',
        desc: 'Request a copy of the personal information we hold about you.',
      },
      {
        icon: 'edit',
        title: 'Right to Rectification',
        desc: 'Correct any inaccurate or incomplete information.',
      },
      {
        icon: 'delete',
        title: 'Right to Erasure',
        desc: 'Request deletion of your data, subject to legal retention requirements.',
      },
      {
        icon: 'file_download',
        title: 'Right to Portability',
        desc: 'Receive your data in a machine-readable format (CSV or JSON).',
      },
      {
        icon: 'block',
        title: 'Right to Object',
        desc: 'Object to processing for marketing or other legitimate-interest purposes.',
      },
      {
        icon: 'pause_circle',
        title: 'Right to Restrict',
        desc: 'Ask us to pause processing while a dispute or correction is being investigated.',
      },
    ],
  },
  {
    id: 'children',
    icon: 'child_care',
    title: '10. Children’s Privacy',
    intro:
      'CoinSensei is not intended for individuals under 18 years of age. We do not knowingly collect personal information from minors. If you believe a minor has provided us with their data, please contact us immediately and we will delete it.',
  },
  {
    id: 'international',
    icon: 'public',
    title: '11. International Data Transfers',
    intro:
      'CoinSensei primarily processes data within Pakistan. Some of our service providers (e.g. cloud infrastructure) may store data outside Pakistan. In such cases we ensure appropriate safeguards through contractual clauses and certifications such as ISO 27001 and SOC 2.',
  },
  {
    id: 'changes',
    icon: 'update',
    title: '12. Changes to This Policy',
    intro:
      'We may update this Privacy Policy from time to time to reflect changes in law, technology, or our services. Material changes will be communicated via email and an in-app notification at least 14 days before they take effect. The "Last updated" date at the top of this page always reflects the most recent version.',
  },
  {
    id: 'contact',
    icon: 'support_agent',
    title: '13. Contact Us',
    intro:
      'Have a privacy question, concern, or want to exercise one of your rights? Our team is here to help — in English or Urdu.',
  },
];

// ── Reading time estimate (~200 wpm) ───────────────────────────
function estimateReadingTime(sections: Section[]): number {
  const text = sections
    .map((s) => [s.intro, ...(s.body ?? []), ...(s.bullets?.map((b) => b.desc) ?? [])].join(' '))
    .join(' ');
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

// ── Main Component ────────────────────────────────────────────
export default function PrivacyPolicy() {
  const readingTime = estimateReadingTime(SECTIONS);

  // Scroll progress for the top bar
  const { scrollYProgress } = useScroll();
  const progressScaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 25,
    restDelta: 0.001,
  });

  // Active section tracking (scrollspy)
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) {
        sectionRefs.current[s.id] = el;
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, []);

  // Back-to-top button visibility
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Mobile TOC drawer
  const [tocOpen, setTocOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top, behavior: 'smooth' });
    setTocOpen(false);
  };

  return (
    <>
      {/* ── Scroll progress bar ───────────────────────────────── */}
      <motion.div
        style={{ scaleX: progressScaleX }}
        className="fixed top-0 left-0 right-0 h-[3px] origin-left z-[60] bg-gradient-to-r from-[--color-primary] via-[--color-primary-light] to-[--color-primary]"
      />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-20 bg-[--color-surface]">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[--color-surface]/60 to-[--color-surface]" />

        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="badge w-fit mx-auto mb-5"
          >
            <Icon name="lock" size={14} className="text-[--color-primary]" />
            Legal · Privacy
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="font-[family-name:var(--font-manrope)] text-center font-extrabold text-5xl md:text-6xl tracking-tight mb-5"
          >
            Your privacy is <span className="gradient-text">non-negotiable</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="text-[--color-text-sec] text-center text-lg max-w-2xl mx-auto leading-relaxed"
          >
            How CoinSensei collects, uses, and protects your information when you exchange USDT and
            PKR — written in plain English, with no fine-print surprises.
          </motion.p>

          {/* Meta strip */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto"
          >
            <MetaCard icon="event_available" label="Last updated" value={LAST_UPDATED} pulse />
            <MetaCard icon="schedule" label="Effective" value={EFFECTIVE_DATE} />
            <MetaCard icon="menu_book" label="Reading time" value={`${readingTime} min`} />
            <MetaCard icon="format_list_numbered" label="Sections" value={`${SECTIONS.length}`} />
          </motion.div>

          {/* Quick jump chips */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className="mt-8 flex flex-wrap gap-2 justify-center"
          >
            {['information-we-collect', 'how-we-use', 'security', 'your-rights', 'contact'].map(
              (id) => {
                const s = SECTIONS.find((x) => x.id === id);
                if (!s) return null;
                return (
                  <button
                    key={id}
                    onClick={() => scrollToSection(id)}
                    className="group inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border border-[--color-border] bg-white/70 backdrop-blur hover:bg-[--color-primary] hover:text-white hover:border-[--color-primary] transition-all duration-200"
                  >
                    <Icon
                      name={s.icon}
                      size={14}
                      className="text-[--color-primary] group-hover:text-white"
                    />
                    {s.title.replace(/^\d+\.\s*/, '')}
                  </button>
                );
              }
            )}
          </motion.div>
        </div>
      </section>

      <hr className="divider-glow" />

      {/* ── Highlights / Privacy at a Glance ─────────────────── */}
      <section className="bg-[--color-surface-mid] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="badge w-fit mx-auto mb-4"
            >
              At a Glance
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-[family-name:var(--font-manrope)] font-extrabold text-3xl md:text-4xl mb-3"
            >
              The promises we live by
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
              className="text-[--color-text-sec] max-w-xl mx-auto"
            >
              Four core commitments that guide every decision we make about your data.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HIGHLIGHTS.map((h, i) => (
              <motion.div
                key={h.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4 }}
                className="feature-card p-6 group"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${h.color} transition-transform group-hover:scale-110`}
                >
                  <Icon name={h.icon} filled size={22} />
                </div>
                <h3 className="font-[family-name:var(--font-manrope)] font-bold text-base mb-2 text-[--color-text-pri]">
                  {h.title}
                </h3>
                <p className="text-sm text-[--color-text-sec] leading-relaxed">{h.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <hr className="divider-glow" />

      {/* ── Main content + sticky TOC ────────────────────────── */}
      <section className="bg-[--color-surface] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-10">
            {/* TOC sidebar (desktop) */}
            <aside className="hidden lg:block">
              <div className="sticky top-28">
                <p className="text-xs font-bold uppercase tracking-widest text-[--color-text-muted] mb-4">
                  On this page
                </p>
                <ul className="space-y-1">
                  {SECTIONS.map((s) => {
                    const active = activeId === s.id;
                    return (
                      <li key={s.id}>
                        <button
                          onClick={() => scrollToSection(s.id)}
                          className={`group w-full text-left text-sm py-2 px-3 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                            active
                              ? 'bg-[--color-primary]/10 text-[--color-primary] font-semibold'
                              : 'text-[--color-text-sec] hover:bg-[--color-surface-mid] hover:text-[--color-text-pri]'
                          }`}
                        >
                          <span
                            className={`w-1 h-5 rounded-full transition-all ${
                              active ? 'bg-[--color-primary]' : 'bg-transparent'
                            }`}
                          />
                          <Icon
                            name={s.icon}
                            size={16}
                            className={active ? 'text-[--color-primary]' : 'text-[--color-text-muted]'}
                          />
                          <span className="truncate">{s.title.replace(/^\d+\.\s*/, '')}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-8 p-4 rounded-2xl border border-[--color-border] bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="mail" size={16} className="text-[--color-primary]" />
                    <p className="font-semibold text-sm text-[--color-text-pri]">Privacy questions?</p>
                  </div>
                  <p className="text-xs text-[--color-text-sec] mb-3 leading-relaxed">
                    Reach the CoinSensei privacy team directly.
                  </p>
                  <a
                    href="mailto:privacy@coinsensei.com"
                    className="text-xs font-semibold text-[--color-primary] hover:underline"
                  >
                    privacy@coinsensei.com →
                  </a>
                </div>
              </div>
            </aside>

            {/* Mobile TOC trigger */}
            <button
              onClick={() => setTocOpen(true)}
              className="lg:hidden flex items-center justify-between w-full px-4 py-3 rounded-xl border border-[--color-border] bg-white text-sm font-semibold text-[--color-text-pri]"
            >
              <span className="flex items-center gap-2">
                <Icon name="list" size={18} className="text-[--color-primary]" />
                Jump to section
              </span>
              <Icon name="expand_more" size={18} className="text-[--color-text-muted]" />
            </button>

            {/* Sections */}
            <div className="space-y-6">
              {SECTIONS.map((s, i) => (
                <SectionCard
                  key={s.id}
                  section={s}
                  index={i}
                  isContact={s.id === 'contact'}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Floating back-to-top ─────────────────────────────── */}
      <AnimatePresence>
        {showTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.6, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full btn-primary shadow-xl flex items-center justify-center"
            aria-label="Back to top"
          >
            <Icon name="arrow_upward" size={22} className="text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Mobile TOC drawer ───────────────────────────────── */}
      <AnimatePresence>
        {tocOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTocOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6 lg:hidden max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="font-[family-name:var(--font-manrope)] font-bold text-lg">
                  Jump to section
                </p>
                <button
                  onClick={() => setTocOpen(false)}
                  className="w-9 h-9 rounded-full bg-[--color-surface-mid] flex items-center justify-center"
                  aria-label="Close"
                >
                  <Icon name="close" size={18} className="text-[--color-text-pri]" />
                </button>
              </div>
              <ul className="space-y-1 pb-6">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => scrollToSection(s.id)}
                      className="w-full text-left text-sm py-2.5 px-3 rounded-lg flex items-center gap-3 hover:bg-[--color-surface-mid] transition-colors text-[--color-text-pri]"
                    >
                      <Icon name={s.icon} size={18} className="text-[--color-primary]" />
                      {s.title}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────
function MetaCard({
  icon,
  label,
  value,
  pulse = false,
}: {
  icon: string;
  label: string;
  value: string;
  pulse?: boolean;
}) {
  return (
    <div className="relative flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-[--color-border]">
      <div className="w-9 h-9 rounded-lg bg-[--color-primary]/10 text-[--color-primary] flex items-center justify-center">
        <Icon name={icon} size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-[--color-text-muted] font-semibold">
          {label}
        </p>
        <p className="text-sm font-semibold text-[--color-text-pri] truncate">{value}</p>
      </div>
      {pulse && (
        <span className="absolute top-2 right-2 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[--color-primary] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[--color-primary]" />
        </span>
      )}
    </div>
  );
}

function SectionCard({
  section,
  index,
  isContact,
}: {
  section: Section;
  index: number;
  isContact: boolean;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <motion.article
      id={section.id}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="scroll-mt-28 feature-card p-7 md:p-9"
    >
      <header className="flex items-start gap-4 mb-5">
        <motion.div
          initial={{ scale: 0.85, rotate: -8 }}
          whileInView={{ scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 + index * 0.02, type: 'spring', stiffness: 200 }}
          className="w-12 h-12 rounded-2xl bg-[--color-primary]/10 text-[--color-primary] flex items-center justify-center shrink-0"
        >
          <Icon name={section.icon} filled size={22} />
        </motion.div>
        <div className="min-w-0">
          <h2 className="font-[family-name:var(--font-manrope)] font-extrabold text-2xl md:text-3xl text-[--color-text-pri] leading-tight">
            {section.title}
          </h2>
        </div>
      </header>

      <p className="text-[--color-text-sec] leading-relaxed">{section.intro}</p>

      {section.body && (
        <ul className="mt-5 space-y-2.5">
          {section.body.map((line) => (
            <li
              key={line}
              className="flex items-start gap-3 text-[--color-text-sec] text-[15px] leading-relaxed"
            >
              <Icon
                name="chevron_right"
                size={18}
                className="text-[--color-primary] shrink-0 mt-0.5"
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )}

      {section.bullets && (
        <div className="mt-6 space-y-2.5">
          {section.bullets.map((b, idx) => {
            const open = expanded === idx;
            return (
              <button
                key={b.title}
                onClick={() => setExpanded(open ? null : idx)}
                className={`w-full text-left rounded-2xl border transition-all duration-200 overflow-hidden ${
                  open
                    ? 'border-[--color-primary]/40 bg-[--color-primary]/5'
                    : 'border-[--color-border] bg-white hover:border-[--color-primary]/30'
                }`}
              >
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="w-10 h-10 rounded-xl bg-[--color-primary]/10 text-[--color-primary] flex items-center justify-center shrink-0">
                    <Icon name={b.icon} size={18} />
                  </div>
                  <p className="flex-1 font-semibold text-[--color-text-pri] text-[15px]">
                    {b.title}
                  </p>
                  <motion.div
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0"
                  >
                    <Icon
                      name="expand_more"
                      size={20}
                      className="text-[--color-text-muted]"
                    />
                  </motion.div>
                </div>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <p className="px-5 pb-5 pl-[4.75rem] text-sm leading-relaxed text-[--color-text-sec]">
                        {b.desc}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>
      )}

      {isContact && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <ContactCard
            icon="mail"
            label="Email"
            value="privacy@coinsensei.com"
            href="mailto:privacy@coinsensei.com"
          />
          <ContactCard
            icon="support_agent"
            label="In-app support"
            value="Open chat"
            href={APP_LINKS.web}
          />
          <ContactCard
            icon="location_on"
            label="Mailing address"
            value="CoinSensei, Karachi, Pakistan"
          />
          <div className="md:col-span-3 mt-2">
            <Button variant="primary" size="lg" href="mailto:privacy@coinsensei.com">
              <Icon name="mail" size={18} className="text-white" />
              Contact the Privacy Team
            </Button>
          </div>
        </div>
      )}
    </motion.article>
  );
}

function ContactCard({
  icon,
  label,
  value,
  href,
}: {
  icon: string;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-[--color-border] hover:border-[--color-primary]/40 transition-colors h-full">
      <div className="w-10 h-10 rounded-xl bg-[--color-primary]/10 text-[--color-primary] flex items-center justify-center shrink-0">
        <Icon name={icon} size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-[--color-text-muted] font-semibold mb-1">
          {label}
        </p>
        <p className="text-sm font-semibold text-[--color-text-pri] break-words">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {inner}
      </a>
    );
  }
  return inner;
}
