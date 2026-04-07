import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import { APP_LINKS } from '@/lib/constants';

const COLS = [
  {
    heading: 'Services',
    links: [
      { label: 'USDT to PKR',  href: '#' },
      { label: 'Bulk Exchange', href: '#' },
      { label: 'Live Rates',   href: '#' },
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
      { label: 'Privacy Policy',   href: '#' },
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
              Pakistan&apos;s most trusted USDT to PKR exchange. Guaranteed payment. Zero scam risk.
            </p>
            {/* App badges */}
            <div className="flex gap-3">
              <Link
                href={APP_LINKS.ios}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[--color-text-pri] text-white hover:opacity-80 transition-opacity"
              >
                <Icon name="phone_iphone" size={16} className="text-white" />
                <div>
                  <div className="text-[9px] uppercase font-semibold opacity-60 leading-none mb-0.5">Download on</div>
                  <div className="text-xs font-bold leading-none">App Store</div>
                </div>
              </Link>
              <Link
                href={APP_LINKS.android}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[--color-text-pri] text-white hover:opacity-80 transition-opacity"
              >
                <Icon name="android" size={16} className="text-white" />
                <div>
                  <div className="text-[9px] uppercase font-semibold opacity-60 leading-none mb-0.5">Get it on</div>
                  <div className="text-xs font-bold leading-none">Google Play</div>
                </div>
              </Link>
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
            © 2025 CoinSensei. Pakistan&apos;s Trusted USDT Exchange.
          </p>
          <p className="text-xs text-[--color-text-muted]" style={{ fontFamily: 'var(--font-inter)' }}>
            All transactions are protected by our payment guarantee.
          </p>
        </div>
      </div>
    </footer>
  );
}
