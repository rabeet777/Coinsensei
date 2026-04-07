// ── Navigation ─────────────────────────────────────────────
export const NAV_LINKS = [
  { label: 'About',        href: '#about' },
  { label: 'Features',     href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Security',     href: '#security' },
  { label: 'Why Us',       href: '#why-us' },
] as const;

// ── Exchange Rate (update this from your API in production) ─
export const USDT_RATE = 280.50;

// ── Trust Badges (hero) ────────────────────────────────────
export const TRUST_BADGES = [
  '100% Guaranteed Payment',
  'Zero Scam Policy',
  'No Bank Holds',
  '24/7 Support',
] as const;

// ── Stats (hero + product preview) ────────────────────────
export const STATS = [
  { value: '5,000+',  label: 'Trades Completed' },
  { value: '₨2B+',    label: 'Volume Processed'  },
  { value: '0',       label: 'Scam Reports'       },
  { value: '4.9★',    label: 'Average Rating'     },
] as const;

// ── Trust Strip ────────────────────────────────────────────
export const TRUST_ITEMS = [
  { icon: 'verified',       color: 'text-green-600 bg-green-50',  title: '100% Payment Guaranteed', sub: 'Every trade, every time' },
  { icon: 'shield',         color: 'text-blue-600 bg-blue-50',    title: 'Anti-Scam Verified',      sub: 'Registered business'     },
  { icon: 'bolt',           color: 'text-cyan-600 bg-cyan-50',    title: 'Instant PKR Transfer',    sub: 'No bank holds ever'      },
  { icon: 'support_agent',  color: 'text-amber-600 bg-amber-50',  title: '24/7 Support',            sub: 'Always here for you'     },
] as const;

// ── Core Features ──────────────────────────────────────────
export const FEATURES = [
  {
    icon: 'verified',
    iconBg: 'bg-green-100 text-green-700 group-hover:bg-green-600 group-hover:text-white',
    title: 'Guaranteed Payment',
    desc: 'Your PKR is secured before or simultaneously with your USDT transfer. Your money is protected from the moment you start a trade.',
  },
  {
    icon: 'shield_lock',
    iconBg: 'bg-[--color-primary]/10 text-[--color-primary] group-hover:bg-[--color-primary] group-hover:text-white',
    title: 'Zero Scam Risk',
    desc: 'CoinSensei is a verified, registered business. Our identity is public, our process is transparent, and every trade is protected.',
  },
  {
    icon: 'bolt',
    iconBg: 'bg-cyan-100 text-cyan-700 group-hover:bg-cyan-600 group-hover:text-white',
    title: 'Instant PKR Transfer',
    desc: 'Receive PKR directly to HBL, Meezan, Easypaisa, or JazzCash. Clean payment sources that never trigger bank holds.',
  },
  {
    icon: 'support_agent',
    iconBg: 'bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
    title: '24/7 Support',
    desc: 'Our dedicated team responds in Urdu and English around the clock — through the app and all support channels.',
  },
  {
    icon: 'price_check',
    iconBg: 'bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white',
    title: 'Best Market Rates',
    desc: 'The most competitive USDT-to-PKR rates in the market. No hidden fees, no surprise deductions. What you see is what you get.',
  },
  {
    icon: 'no_accounts',
    iconBg: 'bg-rose-100 text-rose-600 group-hover:bg-rose-600 group-hover:text-white',
    title: 'No Account Needed',
    desc: 'Use our app without lengthy sign-ups. Start exchanging in minutes — fast, simple, and fully guided inside the CoinSensei app.',
  },
] as const;

// ── How It Works ───────────────────────────────────────────
export const STEPS = [
  {
    n: 1,
    icon: 'download',
    iconBg: 'bg-[--color-primary]/10 text-[--color-primary]',
    title: 'Download the App',
    desc: 'Get the CoinSensei app on iOS or Android. Set up your account in under 2 minutes.',
  },
  {
    n: 2,
    icon: 'send_money',
    iconBg: 'bg-[--color-primary]/10 text-[--color-primary]',
    title: 'Enter Amount & Send USDT',
    desc: 'Enter how much USDT you want to sell. Transfer to our verified wallet address directly in the app.',
  },
  {
    n: 3,
    icon: 'account_balance',
    iconBg: 'bg-green-100 text-green-600',
    title: 'Receive PKR — Guaranteed',
    desc: 'PKR lands in your bank account instantly. HBL, Meezan, Easypaisa, JazzCash — clean transfer, no holds.',
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
    title: 'Payment Escrow Guarantee',
    desc: 'Your PKR is secured before USDT transfer completes. Funds go straight to your bank — we never hold your money.',
  },
  {
    icon: 'business',
    title: 'Registered & Verified Business',
    desc: 'We are not anonymous. CoinSensei is a registered business with a verifiable identity — unlike P2P strangers or unverified OTC dealers.',
  },
  {
    icon: 'account_balance',
    title: 'Clean Funds — Zero Bank Risk',
    desc: 'Our payment sources are clean and compliant. No frozen accounts, no bank flags. Your PKR arrives without any compliance alerts.',
  },
  {
    icon: 'lock',
    title: 'Full Transaction Transparency',
    desc: 'Every transaction is logged, tracked, and protected. Full trade history available in the app. Complete transparency, always.',
  },
] as const;

// ── Testimonials ───────────────────────────────────────────
export const TESTIMONIALS = [
  {
    initials: 'AR',
    name: 'Ahmed Raza',
    city: 'Lahore',
    quote: '"Pehle P2P pe sell karta tha, payment 3 din baad aati thi bank se. CoinSensei app pe pehli transaction mein hi same-day payment mili. Zabardast service hai!"',
  },
  {
    initials: 'FK',
    name: 'Faisal Khan',
    city: 'Karachi',
    quote: '"Main pehle ek OTC dealer se scam ho gaya tha — 500 USDT leke bhaag gaya. CoinSensei pe guarantee hai, pehle payment phir USDT. 100% safe!"',
  },
  {
    initials: 'UA',
    name: 'Usman Ali',
    city: 'Islamabad',
    quote: '"Best rates in market, payment within minutes. Already 10+ trades kar chuka hoon CoinSensei app pe. Poore family ko recommend kiya hai."',
  },
] as const;

// ── Why Choose comparison ──────────────────────────────────
export const COMPARISON_ROWS = [
  { feature: 'Payment Guaranteed',        cs: true,  p2p: false, otc: false },
  { feature: 'No Bank Holds / Freezes',   cs: true,  p2p: false, otc: null  },
  { feature: 'Verified Business Identity',cs: true,  p2p: false, otc: false },
  { feature: 'Same-Day Payment',          cs: true,  p2p: false, otc: null  },
  { feature: '24/7 Support',              cs: true,  p2p: false, otc: null  },
  { feature: 'Dedicated App',             cs: true,  p2p: false, otc: false },
] as const;

// ── App Store Links ────────────────────────────────────────
export const APP_LINKS = {
  ios:     '#',   // replace with App Store URL
  android: '#',   // replace with Google Play URL
  web:     '#',   // replace with web app URL
} as const;
