'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { NAV_LINKS, APP_LINKS } from '@/lib/constants';
import Button from '@/components/ui/Button';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function Navbar() {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={[
          'fixed inset-x-0 top-0 z-50 h-[72px] flex items-center transition-all duration-300',
          scrolled
            ? 'bg-surface/80 backdrop-blur-xl shadow-sm'
            : 'bg-transparent',
        ].join(' ')}
      >
        <nav className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/coinsensei-logo.png"
              alt="CoinSensei logo"
              className="h-10 md:h-12 w-auto object-contain transition-transform duration-300 hover:scale-105"
            />
          </Link>

          {/* Desktop Nav */}
          <ul className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-sm text-[--color-text-sec] hover:text-[--color-text-pri] transition-colors duration-200 font-medium"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <Button variant="primary" size="sm" href="#waitlist">
              Join Waitlist
            </Button>
          </div>

          {/* Mobile Actions (Theme Toggle + Hamburger) */}
          <div className="md:hidden flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 flex flex-col justify-center items-center gap-1.5"
              aria-label="Toggle menu"
            >
              <span className={`block w-5 h-0.5 bg-[--color-text-pri] transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-5 h-0.5 bg-[--color-text-pri] transition-all duration-300 ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
              <span className={`block w-5 h-0.5 bg-[--color-text-pri] transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-surface pt-[72px] flex flex-col"
          >
            <div className="flex flex-col gap-1 p-6">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="py-3.5 px-4 text-lg font-semibold text-[--color-text-pri] rounded-xl hover:bg-[--color-surface-mid] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-3 px-6 mt-auto pb-12">
              <Button variant="primary" size="lg" href="#waitlist" onClick={() => setMenuOpen(false)} className="w-full justify-center">
                Join Waitlist
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
