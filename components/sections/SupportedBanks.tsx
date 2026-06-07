'use client';

import { motion } from 'framer-motion';

const CORE_BANKS = [
  { name: 'Habib Bank Limited (HBL)', logo: 'https://www.google.com/s2/favicons?domain=hbl.com&sz=128' },
  { name: 'Meezan Bank',              logo: 'https://www.google.com/s2/favicons?domain=meezanbank.com&sz=128' },
  { name: 'United Bank Limited (UBL)', logo: '/bank-logos/ubl.png' },
  { name: 'Bank Alfalah',             logo: '/bank-logos/bank-alfalah.png' },
  { name: 'Easypaisa',                logo: '/bank-logos/easypaisa.png' },
  { name: 'JazzCash',                 logo: '/bank-logos/jazzcash.png' },
  { name: 'SadaPay',                  logo: 'https://www.google.com/s2/favicons?domain=sadapay.pk&sz=128' },
  { name: 'NayaPay',                  logo: 'https://www.google.com/s2/favicons?domain=nayapay.com&sz=128' },
] as const;

export default function SupportedBanks() {
  return (
    <section className="py-20 bg-[--color-surface] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="badge w-fit mx-auto mb-3">Supported Banks</div>
          <h3 className="font-[family-name:var(--font-manrope)] font-extrabold text-3xl text-[--color-text-pri]">
            Pakistan Bank Coverage
          </h3>
          <p className="text-[--color-text-sec] mt-2">
            Compliant local transfers across all major Pakistani banks and mobile wallets. Use buy USDT easypaisa or crypto jazzcash options for immediate settlement.
          </p>
        </div>

        {/* Static Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {CORE_BANKS.map((bank, i) => (
            <motion.div
              key={bank.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ delay: i * 0.05, duration: 0.45 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="flex items-center gap-4 rounded-2xl bg-[--color-surface-card] p-5 shadow-lg select-none transition-all duration-300 group cursor-default"
            >
              {/* Logo */}
              <div className="w-12 h-12 flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform duration-300">
                <img
                  src={bank.logo}
                  alt={`Buy USDT with ${bank.name} - CoinSensei PKR Settlement`}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>

              {/* Name */}
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[--color-text-pri] group-hover:text-primary transition-colors duration-150">
                  {bank.name.split(' (')[0]}
                </span>
                <span className="text-[11px] text-[--color-text-muted] font-medium uppercase tracking-wider">
                  Verified Settlement
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
