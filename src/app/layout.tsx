import type { Metadata, Viewport } from "next";
import "@fontsource-variable/unbounded";
import "@fontsource-variable/archivo";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollProgress } from "@/components/layout/ScrollProgress";
import { PageTransition } from "@/components/layout/PageTransition";

export const metadata: Metadata = {
  metadataBase: new URL("https://coinsensei.co"),
  title: {
    default: "Coinsensei — Digitalizing Pakistan's Virtual Asset Future",
    template: "%s · Coinsensei",
  },
  description:
    "Coinsensei is a secure and simple digital asset platform for Pakistan — PKR ⇄ USDT conversion with live rates, on-chain transfers, and a foundation for tokenized finance. Launching soon on Android and iOS.",
  applicationName: "Coinsensei",
  keywords: [
    "Coinsensei",
    "virtual assets Pakistan",
    "PKR to USDT",
    "USDT Pakistan",
    "buy USDT Pakistan",
    "crypto exchange Pakistan",
    "digital assets",
    "tokenized finance",
    "stablecoin Pakistan",
  ],
  authors: [{ name: "Coinsensei" }],
  creator: "Coinsensei",
  publisher: "Coinsensei",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Coinsensei — Digitalizing Pakistan's Virtual Asset Future",
    description:
      "Secure, simple, and modern platform for virtual assets. PKR ⇄ USDT conversion, live rates, and on-chain transfers.",
    url: "https://coinsensei.co",
    type: "website",
    locale: "en_PK",
    siteName: "Coinsensei",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Coinsensei",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Coinsensei — Digitalizing Pakistan's Virtual Asset Future",
    description:
      "Secure, simple, and modern platform for virtual assets in Pakistan.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: { icon: "/logo.png", apple: "/logo.png" },
};

export const viewport: Viewport = {
  themeColor: "#030609",
  width: "device-width",
  initialScale: 1,
};

/* CSS variables for the two font roles. */
const fontVars = {
  ["--font-display" as string]: "'Unbounded Variable', system-ui, sans-serif",
  ["--font-body" as string]: "'Archivo Variable', system-ui, sans-serif",
  ["--font-mono" as string]: "'JetBrains Mono Variable', ui-monospace, monospace",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans" style={fontVars}>
        <ThemeProvider>
          <ScrollProgress />
          <Navbar />
          <main className="min-h-screen">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
