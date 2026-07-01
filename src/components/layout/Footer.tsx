import Link from "next/link";
import Image from "next/image";
import { DISCLAIMER } from "@/lib/data";
import { Button } from "@/components/ui/Button";

const PRODUCT_LINKS = [
  { label: "Features", href: "/features" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Virtual assets", href: "/virtual-assets" },
  { label: "Security", href: "/security" },
];

const COMPANY_LINKS = [
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
  { label: "Join waitlist", href: "/contact" },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line/60">
      <div className="mx-auto max-w-7xl px-5 pb-8 pt-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt=""
                width={32}
                height={32}
                className="rounded-full"
              />
              <span className="font-display text-base font-semibold text-ink">
                Coinsensei
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Digitalizing Pakistan&rsquo;s access to virtual assets — secure,
              simple, and built for what comes next.
            </p>
            <p className="label-mono mt-5 text-faint">
              Launching soon · Android &amp; iOS
            </p>
          </div>

          <nav aria-label="Product">
            <p className="label-mono mb-5 text-faint">Product</p>
            <ul className="space-y-3">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted transition-colors hover:text-brand"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company">
            <p className="label-mono mb-5 text-faint">Company</p>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted transition-colors hover:text-brand"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="label-mono mb-5 text-faint">Get early access</p>
            <p className="mb-5 text-sm text-muted">
              Be first in line when Coinsensei launches in Pakistan.
            </p>
            <Button href="/contact">Join waitlist</Button>
          </div>
        </div>

        <div className="mt-14 border-t border-line/60 pt-6">
          <p className="text-xs leading-relaxed text-faint">{DISCLAIMER}</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-[11px] tracking-wider text-faint">
              © {new Date().getFullYear()} COINSENSEI · PAKISTAN ⇄ ON-CHAIN
            </p>
            <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-2">
              <Link
                href="/privacy-policy"
                className="text-xs text-muted transition-colors hover:text-brand"
              >
                Privacy Policy
              </Link>
              <Link
                href="/delete-account"
                className="text-xs text-muted transition-colors hover:text-brand"
              >
                Delete Account
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* Giant outlined wordmark sliding beneath the fold */}
      <div
        aria-hidden
        className="pointer-events-none select-none overflow-hidden pb-2"
      >
        <p className="text-outline whitespace-nowrap text-center font-display text-[12.2vw] font-bold leading-[0.85] tracking-tight opacity-70">
          COINSENSEI
        </p>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
      </div>
    </footer>
  );
}
