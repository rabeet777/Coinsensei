'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { SUPPORTED_BANKS } from '@/lib/constants';

const BANKS_LOOP = [...SUPPORTED_BANKS, ...SUPPORTED_BANKS];

function BankInitials({ name }: { name: string }) {
  const initials = name
    .replace(/\([^)]*\)/g, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <span className="text-[11px] font-extrabold tracking-wide text-[--color-primary]">
      {initials || 'BK'}
    </span>
  );
}

function BankLogo({
  name,
  domain,
  logo,
}: {
  name: string;
  domain: string;
  logo?: string;
}) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const sources = [
    logo,
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`,
  ].filter(Boolean) as string[];

  if (!sources[sourceIndex]) {
    return <BankInitials name={name} />;
  }

  return (
    <img
      src={sources[sourceIndex]}
      alt={`${name} logo`}
      className="w-8 h-8 object-contain"
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setSourceIndex((prev) => prev + 1)}
    />
  );
}

export default function SupportedBanks() {
  return (
    <section className="pb-20 -mt-6 bg-[--color-surface] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-8">
          <div className="badge w-fit mx-auto mb-3">Supported Banks</div>
          <h3 className="font-[family-name:var(--font-manrope)] font-extrabold text-3xl text-[--color-text-pri]">
            Pakistan Bank Coverage
          </h3>
          <p className="text-[--color-text-sec] mt-2">
            Compliant local transfers across all major Pakistani banks at launch.
          </p>
        </div>
      </div>

      <div className="relative w-screen left-1/2 -translate-x-1/2 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[--color-surface] to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[--color-surface] to-transparent z-10" />

        <motion.div
          className="flex gap-5 w-max py-2"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
        >
          {BANKS_LOOP.map((bank, idx) => (
            <div
              key={`${bank.name}-${idx}`}
              className="shrink-0 min-w-[260px] flex items-center gap-3 rounded-2xl border border-[--color-border] bg-[--color-surface-card] px-5 py-3 shadow-sm"
            >
              <div className="w-10 h-10 rounded-lg bg-[--color-surface-mid] border border-[--color-border] overflow-hidden flex items-center justify-center shrink-0">
                <BankLogo
                  name={bank.name}
                  domain={bank.domain}
                  logo={'logo' in bank ? bank.logo : undefined}
                />
              </div>
              <span className="text-sm font-semibold text-[--color-text-pri] whitespace-nowrap">
                {bank.name}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
