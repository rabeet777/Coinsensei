# Coinsensei — Landing Website

Premium marketing site for Coinsensei, a digital asset platform for Pakistan.
Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, and React Three Fiber.

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
```

## Stack

- **Next.js 14 (App Router) + TypeScript** — fully static output (all routes prerendered)
- **Tailwind CSS** — design tokens via CSS variables (dark default, light toggle; the hero stays dark by design)
- **Framer Motion** — masked line reveals, odometer rate digits, accordions, page fade
- **GSAP + ScrollTrigger** — scroll-scrubbed manifesto, pinned horizontal product gallery
- **three.js** — custom fragment-shader "Exchange Field" hero (mouse-reactive flow field)
- **next-themes** — dark/light switching
- **@fontsource-variable** — Unbounded (display) + Archivo (body) + JetBrains Mono (data), self-hosted
- **lucide-react** — icons

## Structure

```
src/
  app/                 # routes: /, about, virtual-assets, features,
                       # how-it-works, security, faq, contact
  components/
    home/              # homepage sections
    layout/            # Navbar, Footer, ThemeToggle, ScrollProgress, PageTransition
    mockups/           # PhoneMockup, RateCard, TransferCard
    three/             # ThreeScene, FloatingAsset (hero 3D)
    ui/                # GlassCard, Button, AnimatedHeading, FAQAccordion, ...
    forms/             # WaitlistForm, ContactForm
  lib/
    data.ts            # ALL site copy: nav, features, steps, security, FAQ
    motion.ts          # shared animation presets
public/
  logo.png             # brand mark — replace to rebrand
  app/*.png            # original app screenshots (source)
  app/clean/*.png      # background-removed device cutouts used on the site
```

## Where to plug things in

- **Waitlist API** — `src/components/forms/WaitlistForm.tsx`, swap the
  `submitWaitlist()` stub for a `fetch("/api/waitlist", ...)` call (comment marks the spot).
- **Contact API** — same pattern in `src/components/forms/ContactForm.tsx`.
- **Email / socials** — placeholders in `src/app/contact/sections.tsx` (`SOCIALS`, email card).
- **Copy** — nearly all text lives in `src/lib/data.ts`.
- **Screenshots** — the site renders the transparent cutouts in `public/app/clean/`
  (PhoneMockup maps `/app/x.png` → `/app/clean/x.png`). To swap a screen, replace the
  file in `public/app/clean/` (transparent PNG of the device) keeping the filename.
- **Domain** — `metadataBase` in `src/app/layout.tsx` (currently `https://coinsensei.pk`).

## Performance & accessibility notes

- The WebGL hero is dynamically imported (`ssr: false`), pauses when offscreen or the
  tab is hidden, caps device pixel ratio at 1.5, and renders **nothing** under
  `prefers-reduced-motion`. GSAP effects are skipped under reduced motion too.
- All animations respect `prefers-reduced-motion` (global CSS override + per-component checks).
- Fonts are self-hosted variable fonts — no external font requests.
- Screenshots are served through `next/image` with proper sizing.
- Every route is statically prerendered; First Load JS ≈ 88 kB shared.

## Compliance language

Copy deliberately avoids "guaranteed safe", "regulated", "licensed", "risk-free".
Use phrasing like "designed with security in mind" / "built to support safer flows"
when editing. A disclaimer renders in the footer on every page (`src/lib/data.ts → DISCLAIMER`).
