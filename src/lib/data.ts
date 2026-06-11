import {
  ArrowLeftRight,
  Banknote,
  Coins,
  Eye,
  FileClock,
  Fingerprint,
  Globe2,
  History,
  Layers,
  LineChart,
  Lock,
  Network,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Virtual Assets", href: "/virtual-assets" },
  { label: "Features", href: "/features" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Security", href: "/security" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
] as const;

export type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
  detail?: string;
  screen?: string;
};

export const HOME_FEATURES: Feature[] = [
  {
    icon: ArrowLeftRight,
    title: "PKR ⇄ USDT Conversion",
    description: "Buy and sell USDT using PKR through a simple app experience.",
  },
  {
    icon: LineChart,
    title: "Live Rate System",
    description: "View updated rates before confirming your conversion.",
  },
  {
    icon: Network,
    title: "On-Chain Transfers",
    description: "Send and receive USDT through supported blockchain networks.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Account Flow",
    description:
      "Use verification, transaction tracking, and controlled withdrawal processes.",
  },
  {
    icon: History,
    title: "Transaction History",
    description:
      "Track your deposits, withdrawals, conversions, and transfers in one place.",
  },
  {
    icon: Smartphone,
    title: "Mobile-First Platform",
    description:
      "Built for a clean, fast, and easy experience on Android and iOS.",
  },
];

export const FEATURES_PAGE: Feature[] = [
  {
    icon: ArrowLeftRight,
    title: "PKR ⇄ USDT conversion",
    description:
      "Move between Pakistani Rupees and USDT in a few guided steps.",
    detail:
      "A clear you-pay / you-receive flow with quick amount presets, balance context, and a transparent total before you confirm — no order books to decode.",
    screen: "/app/06-P2P-Buy-USDT-Calculator.png",
  },
  {
    icon: LineChart,
    title: "Live rates",
    description: "Always see the current rate before you commit.",
    detail:
      "Rates refresh continuously and are shown next to every conversion, so the price you review is the price you confirm against.",
    screen: "/app/05-P2P-Exchange-BuySellUSDT.png",
  },
  {
    icon: Network,
    title: "On-chain USDT transfers",
    description: "Send and receive USDT on supported blockchain networks.",
    detail:
      "Deposit and withdraw USDT over supported networks, with transaction hashes and source addresses visible in the app for every on-chain movement.",
    screen: "/app/10-Crypto-Transaction-Detail.png",
  },
  {
    icon: History,
    title: "Transaction history",
    description: "Every deposit, withdrawal, transfer, and conversion logged.",
    detail:
      "Separate PKR and crypto views, statuses on every entry, and shareable receipts keep your full activity easy to review.",
    screen: "/app/08-Transaction-History-PKR.png",
  },
  {
    icon: Fingerprint,
    title: "Verification flow",
    description: "Profiles are verified before transacting.",
    detail:
      "Account verification is built into onboarding, supporting a safer environment for everyone using the platform.",
    screen: "/app/03-Home-Dashboard-QuickActions.png",
  },
  {
    icon: Lock,
    title: "Secure withdrawals",
    description: "Withdrawals follow monitored, controlled processes.",
    detail:
      "Withdrawal flows are designed with checks, statuses, and records — built to support safer movement of funds out of your account.",
    screen: "/app/12-Security-Settings.png",
  },
  {
    icon: Smartphone,
    title: "Mobile-first experience",
    description: "Designed for Android and iOS from day one.",
    detail:
      "Fast screens, clear typography, and flows designed for one-handed use — not a desktop terminal squeezed onto a phone.",
    screen: "/app/04-Wallet-AssetBreakdown.png",
  },
  {
    icon: Sparkles,
    title: "Future-ready asset access",
    description: "Built with tokenized finance in mind.",
    detail:
      "The platform is structured so new virtual assets and tokenized instruments can be supported as the ecosystem evolves.",
    screen: "/app/01-Welcome-Landing-SignIn.png",
  },
];

export const TOKENIZATION_CARDS: Feature[] = [
  {
    icon: Coins,
    title: "Virtual Assets",
    description:
      "Access digital assets through a simpler and more guided experience.",
  },
  {
    icon: Layers,
    title: "Tokenized Finance",
    description:
      "Be ready for a future where assets, value, and ownership can move digitally.",
  },
  {
    icon: Network,
    title: "On-Chain Movement",
    description:
      "Send and receive value through supported blockchain networks.",
  },
  {
    icon: Banknote,
    title: "Local Currency Access",
    description:
      "Move between PKR and digital assets with clear and transparent flows.",
  },
];

export const PILLARS: Feature[] = [
  {
    icon: Sparkles,
    title: "Simple",
    description:
      "A clean experience for users who want easy access to digital assets.",
  },
  {
    icon: ShieldCheck,
    title: "Secure",
    description:
      "Account verification, transaction monitoring, and safer withdrawal flows.",
  },
  {
    icon: Globe2,
    title: "Future-Ready",
    description:
      "Built with virtual assets, stablecoins, and tokenized finance in mind.",
  },
];

export type Step = {
  title: string;
  description: string;
  screen: string;
};

export const HOME_STEPS: Step[] = [
  {
    title: "Create your account",
    description: "Sign up and verify your profile.",
    screen: "/app/01-Welcome-Landing-SignIn.png",
  },
  {
    title: "Deposit PKR or USDT",
    description: "Add funds through supported deposit methods.",
    screen: "/app/04-Wallet-AssetBreakdown.png",
  },
  {
    title: "Convert with live rates",
    description: "Exchange PKR and USDT with transparent pricing.",
    screen: "/app/06-P2P-Buy-USDT-Calculator.png",
  },
  {
    title: "Transfer or withdraw",
    description:
      "Send USDT on-chain or withdraw PKR through supported options.",
    screen: "/app/09-Transaction-History-Crypto.png",
  },
];

export const JOURNEY_STEPS: Step[] = [
  {
    title: "Create your account",
    description:
      "Download the app and sign up with your email and phone number. Onboarding takes minutes, not days.",
    screen: "/app/01-Welcome-Landing-SignIn.png",
  },
  {
    title: "Verify your profile",
    description:
      "Complete a guided verification flow. Verification supports a safer environment for everyone transacting on the platform.",
    screen: "/app/12-Security-Settings.png",
  },
  {
    title: "Deposit PKR or USDT",
    description:
      "Fund your wallet with PKR through supported deposit methods, or receive USDT on supported blockchain networks.",
    screen: "/app/04-Wallet-AssetBreakdown.png",
  },
  {
    title: "Convert with live rates",
    description:
      "See the current rate, enter an amount, review the transparent total, and confirm. The price you review is the price you confirm against.",
    screen: "/app/06-P2P-Buy-USDT-Calculator.png",
  },
  {
    title: "Send, receive, or withdraw",
    description:
      "Transfer USDT on-chain, send to other Coinsensei users, or withdraw PKR through supported options — all with monitored flows.",
    screen: "/app/09-Transaction-History-Crypto.png",
  },
  {
    title: "Track everything",
    description:
      "Your full activity — deposits, withdrawals, conversions, and transfers — lives in one clear, reviewable history.",
    screen: "/app/08-Transaction-History-PKR.png",
  },
];

export const SECURITY_SECTIONS: Feature[] = [
  {
    icon: Lock,
    title: "Account access",
    description:
      "Sign-in is designed around password protection, optional biometrics, and two-factor authentication.",
  },
  {
    icon: Fingerprint,
    title: "Verification flows",
    description:
      "Profiles go through guided verification, supporting a safer transacting environment for everyone.",
  },
  {
    icon: Eye,
    title: "Transaction tracking",
    description:
      "Every conversion, transfer, and on-chain movement is recorded with a clear status you can review.",
  },
  {
    icon: ShieldCheck,
    title: "Monitored withdrawals",
    description:
      "Withdrawal processes are monitored and structured with checks, built to support safer movement of funds.",
  },
  {
    icon: FileClock,
    title: "Clear activity history",
    description:
      "PKR and crypto histories are kept separate and complete, with hashes and receipts where relevant.",
  },
  {
    icon: Wallet,
    title: "Safer user experience",
    description:
      "From daily allowances to confirmation steps, flows are designed to slow mistakes down — not your money.",
  },
];

export type FAQItem = { question: string; answer: string };

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is Coinsensei?",
    answer:
      "Coinsensei is a digital asset platform being built for Pakistan. It is designed to make virtual asset access simpler and safer — starting with PKR ⇄ USDT conversion, live rates, and on-chain USDT transfers.",
  },
  {
    question: "Is Coinsensei a crypto exchange?",
    answer:
      "Coinsensei is a virtual asset platform. Rather than complex trading screens, it focuses on guided conversion between PKR and USDT, on-chain transfers, and clear transaction tracking — a practical entry point into digital assets.",
  },
  {
    question: "What can I do with Coinsensei?",
    answer:
      "You can convert PKR to USDT and back with live rates, deposit and withdraw PKR through supported methods, send and receive USDT on supported blockchain networks, and track your full transaction history in one place.",
  },
  {
    question: "What is USDT?",
    answer:
      "USDT (Tether) is a widely used stablecoin — a digital asset designed to track the value of the US dollar. It is commonly used for moving and holding stable digital value on blockchain networks.",
  },
  {
    question: "Can I convert PKR to USDT?",
    answer:
      "Yes. PKR ⇄ USDT conversion is the core of the initial product. You see a live rate, enter an amount, review the transparent total, and confirm.",
  },
  {
    question: "Can I withdraw USDT on-chain?",
    answer:
      "Yes. Coinsensei is designed to support USDT withdrawals to external wallets over supported blockchain networks, with transaction hashes visible in your history.",
  },
  {
    question: "Is Coinsensei available on Android and iOS?",
    answer:
      "Coinsensei is being built mobile-first for both Android and iOS. Join the waitlist to be notified the moment the apps are available.",
  },
  {
    question: "Is Coinsensei launched yet?",
    answer:
      "Coinsensei is launching soon. The waitlist is open now — joining gets you early updates and first access at launch.",
  },
  {
    question: "How do I join the waitlist?",
    answer:
      "Head to the Contact page (or any “Join Waitlist” button on this site), enter your name, email, and phone number, and you'll receive updates before launch.",
  },
  {
    question: "Is Coinsensei designed for beginners?",
    answer:
      "Yes. The product is intentionally guided: clear amounts, visible rates, confirmation steps, and plain-language history. You don't need trading experience to use it.",
  },
  {
    question: "What are virtual assets?",
    answer:
      "Virtual assets are digital representations of value that can be stored, transferred, or traded using digital technology — including stablecoins like USDT and other tokenized forms of value.",
  },
  {
    question: "What is tokenization?",
    answer:
      "Tokenization is the process of representing real-world or digital assets as tokens on a blockchain or digital ledger, allowing value and ownership to move faster and more transparently.",
  },
  {
    question: "How does Coinsensei approach security?",
    answer:
      "Coinsensei is designed with security in mind: verified profiles, two-factor authentication, monitored withdrawal processes, and a complete, reviewable activity history. We use careful, honest language — no platform should promise absolute safety.",
  },
];

export const DISCLAIMER =
  "Coinsensei is launching soon. Information on this website is for product introduction and educational purposes only and should not be considered financial advice.";
