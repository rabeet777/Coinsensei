'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/components/ui/Icon';

const FAQ_ITEMS = [
  {
    question: 'Is crypto legal in Pakistan in 2026?',
    answer: 'There is no formal ban on holding or trading crypto in Pakistan. CoinSensei operates under a registered corporate structure (CoinSensei Tech Private Limited, SECP CUIN: 0248591) and complies with local anti-money laundering (AML) guidelines to provide a compliant, safer interface for digital assets.',
  },
  {
    question: 'Will my bank account get frozen?',
    answer: 'Bank freezes occur on peer-to-peer (P2P) platforms when you transact with unverified accounts or get flagged in informal circles. CoinSensei eliminates this risk entirely by settling PKR directly through verified, corporate payment channels. We never match you with anonymous buyers or sellers.',
  },
  {
    question: 'How fast can I withdraw PKR to my bank or mobile wallet?',
    answer: 'Withdrawals are processed instantly. If you withdraw to mobile wallets like JazzCash and Easypaisa, or digital banks like SadaPay and NayaPay, the settlement occurs in real time. Traditional commercial bank transfers are processed immediately through RAAST integration.',
  },
  {
    question: 'Do I need a traditional bank account to use CoinSensei?',
    answer: 'No traditional bank account is needed! You can deposit PKR, buy USDT, and withdraw PKR directly using mobile wallets like Easypaisa and JazzCash. This is designed specifically to support first-time buyers and unbanked users.',
  },
  {
    question: 'What is the minimum deposit and transaction limit?',
    answer: 'You can start converting or transferring from as low as 1,500 PKR (approx. $5 USDT). This low minimum threshold lets you test the platform, verify your wallet, and practice transfers with absolute peace of mind.',
  },
  {
    question: 'What happens if a transaction goes wrong or is delayed?',
    answer: 'We provide dedicated 24/7 customer support in both Urdu and English. If you experience any delays or have questions, you can contact our team instantly via the in-app support center or the floating WhatsApp button in the corner.',
  },
  {
    question: 'What are the fees on CoinSensei?',
    answer: 'CoinSensei operates on a transparent, no-hidden-fee pricing model. The rate you see is the rate you get. On-chain transfers only incur standard blockchain network gas fees (e.g. TRON/BSC network fees) without any platform markup.',
  },
  {
    question: 'How are my crypto assets secured?',
    answer: 'Your crypto assets are secured using multi-signature cold vaults. This means that moving funds requires authorization from multiple independent keyholders, ensuring protection from hacks or singular security vulnerabilities.',
  },
];

function FAQItem({ question, answer, isOpen, onClick }: { question: string; answer: string; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="border-b border-[--color-border] last:border-b-0 py-4.5">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between gap-4 text-left py-2 font-[family-name:var(--font-manrope)] font-bold text-lg text-[--color-text-pri] hover:text-primary transition-colors cursor-pointer select-none"
      >
        <span>{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="text-primary shrink-0"
        >
          <Icon name="expand_more" size={24} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pt-2 pb-3 text-sm text-[--color-text-sec] leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="section-py bg-[--color-surface-mid] relative overflow-hidden">
      {/* Glow Backdrop Blob */}
      <div className="absolute top-1/2 right-1/4 w-[350px] h-[350px] rounded-full bg-primary/4 blur-[130px] z-0 pointer-events-none select-none" />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="badge w-fit mx-auto mb-4">FAQ</div>
          <h2 className="font-[family-name:var(--font-manrope)] font-extrabold text-4xl text-[--color-text-pri] mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-[--color-text-sec] max-w-lg mx-auto leading-relaxed">
            Answering the top questions about legality, security, and transactions in Pakistan.
          </p>
        </div>

        {/* Collapsible Accordion Grid */}
        <div className="bg-[--color-surface-card] border border-white/5 shadow-xl rounded-3xl p-6 md:p-8">
          {FAQ_ITEMS.map((item, idx) => (
            <FAQItem
              key={idx}
              question={item.question}
              answer={item.answer}
              isOpen={openIndex === idx}
              onClick={() => handleToggle(idx)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
