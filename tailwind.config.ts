import type { Config } from "tailwindcss";

/**
 * Coinsensei design system — "The Exchange Field".
 * Colors map to CSS variables (globals.css) so dark/light stay in one place.
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        faint: "rgb(var(--faint) / <alpha-value>)",
        brand: {
          DEFAULT: "rgb(var(--brand) / <alpha-value>)",
          deep: "rgb(var(--brand-deep) / <alpha-value>)",
          soft: "rgb(var(--brand-soft) / <alpha-value>)",
        },
        mint: "rgb(var(--mint) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
        "4xl": "2.5rem",
      },
      boxShadow: {
        card: "0 1px 0 0 rgb(255 255 255 / 0.04) inset, 0 20px 50px -24px rgb(0 0 0 / 0.7)",
        "card-light":
          "0 1px 2px rgb(13 32 48 / 0.05), 0 16px 40px -24px rgb(13 32 48 / 0.18)",
        glow: "0 0 56px -10px rgb(var(--brand) / 0.5)",
        "glow-sm": "0 0 28px -6px rgb(var(--brand) / 0.42)",
        "glow-mint": "0 0 48px -10px rgb(var(--mint) / 0.45)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "marquee-reverse": {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        "float-y": {
          "0%, 100%": { transform: "translateY(-5px)" },
          "50%": { transform: "translateY(7px)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.15" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(420%)" },
        },
      },
      animation: {
        marquee: "marquee 32s linear infinite",
        "marquee-fast": "marquee 18s linear infinite",
        "marquee-reverse": "marquee-reverse 36s linear infinite",
        "spin-slow": "spin-slow 30s linear infinite",
        "pulse-soft": "pulse-soft 3.4s ease-in-out infinite",
        "float-y": "float-y 7s ease-in-out infinite",
        blink: "blink 1.6s steps(1) infinite",
        scanline: "scanline 5.5s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
