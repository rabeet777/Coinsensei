'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';

interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: 'Guides' | 'Legality' | 'Security' | 'Comparison';
  date: string;
  readTime: string;
  implemented: boolean;
  searchKeywords: string[];
}

const ARTICLES: Article[] = [
  {
    slug: 'how-to-buy-usdt-safely',
    title: 'How to Buy USDT in Pakistan Safely (2026 Guide)',
    excerpt: 'Avoid bank account freezes, P2P card locks, and escrow scams. Learn step-by-step how to convert PKR to USDT securely.',
    category: 'Guides',
    date: 'Jun 7, 2026',
    readTime: '6 min read',
    implemented: true,
    searchKeywords: ['buy crypto Pakistan', 'USDT to PKR', 'buy USDT easypaisa', 'crypto jazzcash'],
  },
  {
    slug: 'crypto-legal-pakistan-2026',
    title: 'Is Crypto Legal in Pakistan in 2026? Regulatory Updates',
    excerpt: 'Understanding SECP frameworks, compliance gateways, and the transition from informal trading to regulated digital assets.',
    category: 'Legality',
    date: 'May 28, 2026',
    readTime: '8 min read',
    implemented: true,
    searchKeywords: ['buy crypto Pakistan', 'crypto exchange Pakistan', 'safe crypto trading Pakistan'],
  },
  {
    slug: 'coinsensei-vs-binance-p2p',
    title: 'CoinSensei vs Binance P2P: Which Crypto Gateway is Safer?',
    excerpt: 'Comparing informal peer-to-peer trading risks with CoinSensei\'s compliant, direct-to-bank PKR settlement model.',
    category: 'Comparison',
    date: 'May 14, 2026',
    readTime: '5 min read',
    implemented: false,
    searchKeywords: ['crypto exchange Pakistan', 'safe crypto trading Pakistan', 'USDT to PKR'],
  },
  {
    slug: 'protect-bank-account-p2p-scams',
    title: 'How to Protect Your Pakistani Bank Account from P2P Scams',
    excerpt: 'Why peer-to-peer trading triggers bank account freezes in Pakistan and how you can prevent it using compliant gateways.',
    category: 'Security',
    date: 'Apr 30, 2026',
    readTime: '7 min read',
    implemented: false,
    searchKeywords: ['safe crypto trading Pakistan', 'USDT to PKR', 'buy USDT easypaisa'],
  },
  {
    slug: 'usdt-beginners-guide-stablecoins',
    title: 'Understanding USDT: The Beginner\'s Guide to Stablecoins',
    excerpt: 'What is USDT, how does it maintain its 1:1 USD peg, and why is it popular for digital asset savings in Pakistan?',
    category: 'Guides',
    date: 'Apr 12, 2026',
    readTime: '4 min read',
    implemented: false,
    searchKeywords: ['buy crypto Pakistan', 'USDT to PKR'],
  },
  {
    slug: 'on-chain-crypto-transfers-trc20',
    title: 'On-Chain Crypto Transfers: TRC20, ERC20 & BEP20 Networks',
    excerpt: 'How blockchain networks work and how to transfer USDT securely in Pakistan without paying heavy transaction fees.',
    category: 'Guides',
    date: 'Mar 25, 2026',
    readTime: '6 min read',
    implemented: false,
    searchKeywords: ['buy crypto Pakistan', 'crypto jazzcash', 'buy USDT easypaisa'],
  },
];

const CATEGORIES = ['All', 'Guides', 'Legality', 'Security', 'Comparison'] as const;

export default function BlogIndexPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredArticles = ARTICLES.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.searchKeywords.some((kw) => kw.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <Navbar />
      <main className="relative min-h-screen pt-28 pb-20 overflow-hidden bg-[--color-surface]">
        {/* Ambient Blur Backdrop blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
          <div className="absolute top-[10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-primary/10 dark:bg-primary/5 blur-[130px]" />
          <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary-dark/8 dark:bg-primary-dark/4 blur-[160px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="badge w-fit mx-auto mb-4"
            >
              CoinSensei Knowledge Hub
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="font-[family-name:var(--font-manrope)] font-extrabold text-4xl md:text-5xl text-[--color-text-pri] mb-4"
            >
              Guides, Insights & <span className="gradient-text">Crypto Education</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-[--color-text-sec] leading-relaxed"
            >
              Learn how to buy crypto in Pakistan safely, understand current local regulations, and protect your banking transactions.
            </motion.p>
          </div>

          {/* Search & Category Filter bar */}
          <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-12 bg-[--color-surface-mid]/40 p-4 rounded-3xl border border-[--color-border] backdrop-blur-md">
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto no-scrollbar py-1">
              {CATEGORIES.map((cat) => {
                const isActive = cat === selectedCategory;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap border ${
                      isActive
                        ? 'bg-primary text-white border-primary shadow-[0_4px_12px_rgba(0,216,255,0.25)]'
                        : 'bg-[--color-surface] text-[--color-text-muted] border-[--color-border] hover:text-[--color-text-sec]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[--color-surface] border border-[--color-border] text-sm text-[--color-text-pri] focus:border-primary focus:outline-none transition-colors"
              />
              <div className="absolute left-3.5 top-3 text-[--color-text-muted]">
                <Icon name="search" size={18} />
              </div>
            </div>
          </div>

          {/* Articles Grid */}
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
          >
            <AnimatePresence mode="popLayout">
              {filteredArticles.map((article, i) => (
                <motion.article
                  key={article.slug}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.45 }}
                  className="feature-card flex flex-col h-full bg-[--color-surface-mid]/30 backdrop-blur-sm group cursor-pointer"
                >
                  <Link href={article.implemented ? `/blog/${article.slug}` : '#waitlist'} className="flex flex-col h-full p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] uppercase tracking-widest font-extrabold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {article.category}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-[--color-text-muted]">
                        <Icon name="schedule" size={13} />
                        <span>{article.readTime}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-[family-name:var(--font-manrope)] font-bold text-lg text-[--color-text-pri] mb-3 group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-xs text-[--color-text-sec] leading-relaxed mb-6 flex-1 line-clamp-3">
                      {article.excerpt}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-[--color-border]/50 mt-auto text-xs font-bold">
                      <span className="text-[--color-text-muted]">{article.date}</span>
                      <span className="flex items-center gap-1 text-primary group-hover:translate-x-1 transition-transform">
                        {article.implemented ? 'Read Article' : 'Join Waitlist for Access'}
                        <Icon name="arrow_forward" size={14} />
                      </span>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </AnimatePresence>

            {filteredArticles.length === 0 && (
              <div className="col-span-full py-16 text-center text-[--color-text-muted]">
                <Icon name="inbox" size={40} className="mx-auto mb-3 opacity-50" />
                <p>No articles found matching your criteria.</p>
              </div>
            )}
          </motion.div>

          {/* Bottom Waitlist CTA */}
          <div className="feature-card p-10 bg-gradient-to-br from-primary/10 via-transparent to-transparent text-center rounded-3xl border border-[--color-border]">
            <h3 className="font-[family-name:var(--font-manrope)] font-extrabold text-2xl text-[--color-text-pri] mb-3">
              Get Safe Crypto Content Weekly
            </h3>
            <p className="text-sm text-[--color-text-sec] max-w-xl mx-auto mb-6 leading-relaxed">
              Subscribe to the CoinSensei newsletter to get our latest guides, legal deep-dives, and safe trading articles straight to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email address"
                className="w-full px-4 py-2.5 rounded-xl bg-[--color-surface] border border-[--color-border] text-sm text-[--color-text-pri] focus:border-primary focus:outline-none flex-1"
              />
              <Button variant="primary" size="sm" href="#waitlist" className="w-full sm:w-auto">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
