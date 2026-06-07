import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import { APP_LINKS } from '@/lib/constants';

const COLS = [
  {
    heading: 'Services',
    links: [
      { label: 'Crypto Access',        href: '#features' },
      { label: 'On-Chain Transfers',   href: '#features' },
      { label: 'Waitlist SignUp',      href: '#waitlist' },
      { label: 'Crypto Blog',          href: '/blog' },
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
      { label: 'Terms of Service', href: '/terms-of-service' },
      { label: 'Privacy Policy',   href: '/privacy-policy' },
      { label: 'Risk Disclosure',  href: '/risk-disclosure' },
      { label: 'AML Policy',       href: '/aml-policy' },
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
              Pakistan&apos;s secure gateway to crypto. Join the waitlist to secure your early access.
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

            {/* Social Media Links */}
            <div className="flex gap-4 pt-2">
              <a
                href="https://x.com/CoinSensei"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[--color-text-muted] hover:text-[--color-primary] transition-colors duration-200"
                aria-label="CoinSensei on Twitter/X"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://t.me/CoinSensei"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[--color-text-muted] hover:text-[--color-primary] transition-colors duration-200"
                aria-label="CoinSensei on Telegram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M11.944 0C5.352 0 0 5.352 0 12c0 6.648 5.352 12 11.944 12 6.648 0 12-5.352 12-12 0-6.648-5.352-12-12-12zm5.568 8.448l-1.92 9.072c-.144.648-.528.816-1.08.504l-2.928-2.16-1.416 1.368c-.156.156-.288.288-.6.288l.216-3.036 5.532-5c.24-.216-.048-.336-.372-.12l-6.84 4.308-2.94-.924c-.636-.204-.648-.636.132-.936l11.472-4.428c.528-.192.996.12 0 1.032z" />
                </svg>
              </a>
              <a
                href="https://youtube.com/@CoinSensei"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[--color-text-muted] hover:text-[--color-primary] transition-colors duration-200"
                aria-label="CoinSensei on YouTube"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C22 8.68 22 12 22 12s0 3.32-.42 4.814a2.504 2.504 0 0 1-1.768 1.768C18.32 19 12 19 12 19s-6.32 0-7.812-.418a2.505 2.505 0 0 1-1.768-1.768C2 15.32 2 12 2 12s0-3.32.42-4.814a2.505 2.505 0 0 1 1.768-1.768C5.68 5 12 5 12 5s6.32 0 7.812.418zm-11.19 9.878L14.62 12 8.622 8.704v6.592z" clipRule="evenodd" />
                </svg>
              </a>
              <a
                href="https://instagram.com/coinsensei.co/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[--color-text-muted] hover:text-[--color-primary] transition-colors duration-200"
                aria-label="CoinSensei on Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                </svg>
              </a>
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
            © 2026 CoinSensei. Pakistan's Trusted Crypto Platform.
          </p>
          <p className="text-xs text-[--color-text-muted]" style={{ fontFamily: 'var(--font-inter)' }}>
            Preparing Pakistan for a tokenized financial future.
          </p>
        </div>
      </div>
    </footer>
  );
}
