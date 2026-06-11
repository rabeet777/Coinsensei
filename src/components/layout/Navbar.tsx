"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "./ThemeToggle";

/** Instrument bar: full-width hairline header, mono links, ledger feel. */
export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-all duration-300",
        scrolled || open
          ? "border-line/70 bg-bg/85 backdrop-blur-xl"
          : "border-transparent bg-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="Coinsensei home"
        >
          <Image
            src="/logo.png"
            alt=""
            width={30}
            height={30}
            className="rounded-full"
            priority
          />
          <span
            className={cn(
              "font-display text-[15px] font-semibold tracking-tight transition-colors duration-300",
              scrolled || open ? "text-ink" : "text-white"
            )}
          >
            Coinsensei
          </span>
        </Link>

        {/* Desktop links — mono ledger tabs */}
        <div className="hidden items-center xl:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "group relative px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors",
                  active ? "text-brand" : "text-muted hover:text-ink"
                )}
              >
                {link.label}
                <span
                  className={cn(
                    "absolute inset-x-3.5 -bottom-[1px] h-px origin-left bg-brand transition-transform duration-300",
                    active
                      ? "scale-x-100"
                      : "scale-x-0 group-hover:scale-x-100 group-hover:bg-muted"
                  )}
                />
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <span className="hidden sm:block">
            <Button href="/contact" magnetic>
              Join waitlist
            </Button>
          </span>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="flex h-9 w-9 items-center justify-center border border-line text-ink xl:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-line/60 bg-bg/95 backdrop-blur-xl xl:hidden"
          >
            <div className="mx-auto flex max-w-7xl flex-col px-4 py-3 sm:px-6">
              {NAV_LINKS.map((link, i) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center justify-between border-b border-line/40 px-1 py-3.5 font-mono text-xs uppercase tracking-[0.16em] transition-colors",
                    pathname === link.href
                      ? "text-brand"
                      : "text-muted hover:text-ink"
                  )}
                >
                  {link.label}
                  <span className="text-[10px] text-faint">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </Link>
              ))}
              <div className="py-4">
                <Button href="/contact" className="w-full">
                  Join waitlist
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
