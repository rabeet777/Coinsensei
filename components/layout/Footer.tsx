import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import { APP_LINKS } from '@/lib/constants';

const COLS = [
  {
    heading: 'Services',
    links: [
      { label: 'Virtual Assets Access', href: '#features' },
      { label: 'On-Chain Transfers',   href: '#features' },
      { label: 'Waitlist SignUp',      href: '#waitlist' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About Us',       href: '#about'    },
      { label: 'Security',       href: '#security' },
      { label: 'Why CoinSensei', href: '#why-us'   },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Terms of Service', href: '#' },
      { label: 'Privacy Policy',   href: '/privacy-policy' },
      { label: 'Risk Disclosure',  href: '#' },
      { label: 'AML Policy',       href: '#' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[--color-surface-mid] border-t border-[--color-border]">
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl btn-primary flex items-center justify-center">
                <Icon name="currency_exchange" filled size={16} className="text-white" />
              </div>
              <span className="font-[family-name:var(--font-manrope)] font-black text-lg text-[--color-text-pri]">
                Coin<span className="text-[--color-primary]">Sensei</span>
              </span>
            </div>
            <p className="text-sm text-[--color-text-muted] leading-relaxed">
              Pakistan&apos;s secure gateway to virtual assets. Join the waitlist to secure your early access.
            </p>
            {/* App badges */}
            <div className="flex flex-wrap gap-3">
              <div
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[--color-surface-high] text-[--color-text-muted] border border-[--color-border] select-none"
              >
                <Icon name="phone_iphone" size={16} className="text-[--color-text-muted]" />
                <div>
                  <div className="text-[9px] uppercase font-semibold opacity-60 leading-none mb-0.5">App Store</div>
                  <div className="text-xs font-bold leading-none">Coming Soon</div>
                </div>
              </div>
              <div
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[--color-surface-high] text-[--color-text-muted] border border-[--color-border] select-none"
              >
                <Icon name="android" size={16} className="text-[--color-text-muted]" />
                <div>
                  <div className="text-[9px] uppercase font-semibold opacity-60 leading-none mb-0.5">Google Play</div>
                  <div className="text-xs font-bold leading-none">Coming Soon</div>
                </div>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {COLS.map((col) => (
            <div key={col.heading} className="space-y-4">
              <h5 className="font-[family-name:var(--font-manrope)] font-bold text-sm text-[--color-text-pri]">
                {col.heading}
              </h5>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-xs font-medium uppercase tracking-widest text-[--color-text-muted] hover:text-[--color-primary] transition-colors duration-200"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[--color-border] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[--color-text-muted] uppercase tracking-widest" style={{ fontFamily: 'var(--font-inter)' }}>
            © 2026 CoinSensei. Digitalizing Pakistan&apos;s Virtual Asset Future.
          </p>
          <p className="text-xs text-[--color-text-muted]" style={{ fontFamily: 'var(--font-inter)' }}>
            Preparing Pakistan for a tokenized financial future.
          </p>
        </div>
      </div>
    </footer>
  );
}
