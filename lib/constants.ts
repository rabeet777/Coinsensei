// ── Navigation ─────────────────────────────────────────────
export const NAV_LINKS = [
  { label: 'About',        href: '/#about' },
  { label: 'Features',     href: '/#features' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Security',     href: '/#security' },
  { label: 'Why Us',       href: '/#why-us' },
] as const;

// ── Exchange Rate (update this from your API in production) ─
export const USDT_RATE = 280.50;

// ── Trust Badges (hero) ────────────────────────────────────
export const TRUST_BADGES = [
  'On-Chain Transfers',
  'Vibrant Live Rates',
  'Secure Custody',
  'Zero P2P Scam Risk',
] as const;

// ── Stats (hero + product preview) ────────────────────────
export const STATS = [
  { value: '10,000+', label: 'Waitlist Spots' },
  { value: '0%',      label: 'Hidden Fees'     },
  { value: '256-bit', label: 'AES Encryption'  },
  { value: 'Instant', label: 'On-Chain Transfer' },
] as const;

// ── Trust Strip ────────────────────────────────────────────
export const TRUST_ITEMS = [
  { icon: 'lock',           title: 'Secure & Regulated',      sub: 'Top-tier digital custodian' },
  { icon: 'swap_horiz',     title: 'Instant Transfers',       sub: 'Zero latency on-chain conversions' },
  { icon: 'trending_up',    title: 'Vibrant Live Rates',      sub: 'Always real-time pricing' },
  { icon: 'account_balance',title: 'Direct PKR Settlement',   sub: 'No third-party bank hold risk' },
] as const;

// ── Core Features ──────────────────────────────────────────
export const FEATURES = [
  {
    icon: 'account_balance_wallet',
    title: 'Secure On-Chain Custody',
    desc: 'Keep your digital assets secure. Advanced multi-sig wallet security and full compliance protect your assets around the clock.',
  },
  {
    icon: 'swap_calls',
    title: 'Zero Latency Conversions',
    desc: 'Instantly convert between PKR and USDT. Real-time rate execution makes lock-ins simple, secure, and transparent.',
  },
  {
    icon: 'dashboard_customize',
    title: 'On-Chain Transfers',
    desc: 'Move funds across networks securely. Coinsensei supports major virtual asset transfer protocols with low transaction fees.',
  },
  {
    icon: 'partner_exchange',
    title: 'Preparation for Tokenization',
    desc: 'Step into the future of global finance. Learn, trade, and prepare for tokenized asset ownership in Pakistan.',
  },
  {
    icon: 'support_agent',
    title: 'Dedicated Urdu Support',
    desc: 'Access custom in-app support in Urdu and English. Our team is available around the clock to guide you on-chain.',
  },
  {
    icon: 'no_accounts',
    title: 'Waitlist Privilege',
    desc: 'Join the waitlist today. Early users get first access to live features, premium rate lock-ins, and zero service fees.',
  },
] as const;

// ── How It Works ───────────────────────────────────────────
export const STEPS = [
  {
    n: 1,
    icon: 'mail',
    title: 'Join the Waitlist',
    desc: 'Register with your email to lock in your early position on Pakistan’s premier virtual asset gateway.',
  },
  {
    n: 2,
    icon: 'how_to_reg',
    title: 'Secure Invitation',
    desc: 'Receive your personalized invite code to download the beta client and verify your identity securely.',
  },
  {
    n: 3,
    icon: 'currency_exchange',
    title: 'Access Virtual Assets',
    desc: 'Start converting PKR/USDT, transferring on-chain, and preparing for the tokenized future.',
  },
] as const;

// ── Supported Banks (slider) ───────────────────────────────
export const SUPPORTED_BANKS = [
  { name: 'Habib Bank Limited (HBL)',      domain: 'hbl.com' },
  { name: 'Meezan Bank',                   domain: 'meezanbank.com' },
  {
    name: 'United Bank Limited (UBL)',
    domain: 'ubl.com.pk',
    logo: '/bank-logos/ubl.svg',
  },
  { name: 'MCB Bank',                      domain: 'mcb.com.pk' },
  {
    name: 'Bank Alfalah',
    domain: 'bankalfalah.com',
    logo: '/bank-logos/bank-alfalah.svg',
  },
  { name: 'Allied Bank Limited (ABL)',     domain: 'abl.com' },
  { name: 'Bank Al Habib',                 domain: 'bankalhabib.com' },
  { name: 'Askari Bank',                   domain: 'askaribank.com.pk' },
  { name: 'Faysal Bank',                   domain: 'faysalbank.com' },
  { name: 'Standard Chartered Pakistan',   domain: 'sc.com' },
  { name: 'Easypaisa',                     domain: 'easypaisa.com.pk', logo: '/bank-logos/easypaisa.svg' },
  { name: 'JazzCash',                      domain: 'jazzcash.com.pk',  logo: '/bank-logos/jazzcash.svg' },
  { name: 'NayaPay',                       domain: 'nayapay.com' },
  { name: 'SadaPay',                       domain: 'sadapay.pk' },
] as const;

// ── Security Features ──────────────────────────────────────
export const SECURITY_FEATURES = [
  {
    icon: 'verified_user',
    title: 'Multi-Sig Escrow Custody',
    desc: 'Your virtual assets are protected by advanced multi-signature cold storage. We never hold your PKR and settle directly.',
  },
  {
    icon: 'business',
    title: 'Registered Corporate Gateway',
    desc: 'We operate as a registered digital portal. Your transactions are secure and auditable, avoiding informal P2P security traps.',
  },
  {
    icon: 'account_balance',
    title: 'Clean Banking Compliance',
    desc: 'Our payment settlement channels are fully compliant. Say goodbye to flagged cards, frozen funds, and compliance warnings.',
  },
  {
    icon: 'lock',
    title: 'On-Chain Transparency',
    desc: 'Every asset conversion and transfer is logged on-chain. Track your transactions in real-time with absolute clarity.',
  },
] as const;

// ── Testimonials ───────────────────────────────────────────
export const TESTIMONIALS = [
  {
    initials: 'AR',
    name: 'Ahmed Raza',
    city: 'Lahore',
    quote: '"Main waitlist member tha aur beta access mila. PKR to USDT exchange aur on-chain transfer bohot hi clean aur smooth tha, no risk at all!"',
  },
  {
    initials: 'FK',
    name: 'Faisal Khan',
    city: 'Karachi',
    quote: '"Finally a platform in Pakistan that doesn\'t feel like a P2P gamble. The waitlist privilege rate locks are incredible."',
  },
  {
    initials: 'UA',
    name: 'Usman Ali',
    city: 'Islamabad',
    quote: '"Preparing for tokenized assets in Pakistan is a huge step. Coinsensei is building the exact bridge we need for the future of finance."',
  },
  ] as const;

// ── Why Choose comparison ──────────────────────────────────
export const COMPARISON_ROWS = [
  { feature: 'On-Chain Asset Access',     cs: true,  p2p: false, otc: null  },
  { feature: 'No Bank Hold/Freeze Risks',  cs: true,  p2p: false, otc: null  },
  { feature: 'Regulated Custody Gateway',  cs: true,  p2p: false, otc: false },
  { feature: 'Urdu Live Support',          cs: true,  p2p: false, otc: false },
  { feature: 'Direct PKR Settlements',     cs: true,  p2p: true,  otc: null  },
  { feature: 'Tokenized Finance Access',   cs: true,  p2p: false, otc: false },
] as const;

// ── App Store Links ────────────────────────────────────────
export const APP_LINKS = {
  ios:     '#',   // replace with App Store URL
  android: '#',   // replace with Google Play URL
  web:     '#',   // replace with web app URL
} as const;
