import Navbar          from '@/components/layout/Navbar';
import Footer          from '@/components/layout/Footer';
import Hero            from '@/components/sections/Hero';
import TrustStrip      from '@/components/sections/TrustStrip';
import WhatIsCoinsensei from '@/components/sections/WhatIsCoinsensei';
import TokenizationSection from '@/components/sections/TokenizationSection';
import ProductIntro from '@/components/sections/ProductIntro';
import CoreFeatures    from '@/components/sections/CoreFeatures';
import HowItWorks      from '@/components/sections/HowItWorks';
import SupportedBanks  from '@/components/sections/SupportedBanks';
import SecuritySection from '@/components/sections/SecuritySection';
import ProductPreview  from '@/components/sections/ProductPreview';
import WhyChoose       from '@/components/sections/WhyChoose';
import FinalCTA        from '@/components/sections/FinalCTA';

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden">
        {/* Drifting Ambient Background Shadow Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
          <div className="absolute top-[10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-primary/5 dark:bg-primary/3 blur-[140px] animate-blob" />
          <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary-dark/4 dark:bg-primary-dark/2 blur-[170px] animate-blob" style={{ animationDelay: '4s' }} />
          <div className="absolute top-[55%] left-[-5%] w-[450px] h-[450px] rounded-full bg-primary-light/4 dark:bg-primary-light/2 blur-[150px] animate-blob" style={{ animationDelay: '8s' }} />
          <div className="absolute top-[75%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/4 dark:bg-primary/2 blur-[160px] animate-blob" style={{ animationDelay: '12s' }} />
          <div className="absolute bottom-[2%] left-[10%] w-[380px] h-[380px] rounded-full bg-primary-dark/4 dark:bg-primary-dark/2 blur-[135px] animate-blob" style={{ animationDelay: '16s' }} />
        </div>

        {/* 1. Hero */}
        <Hero />
        {/* 2. Trust Strip */}
        <TrustStrip />
        {/* 3. What is CoinSensei */}
        <WhatIsCoinsensei />
        {/* divider */}
        <hr className="divider-glow" />
        {/* 3.5. Tokenization & Virtual Assets */}
        <TokenizationSection />
        {/* divider */}
        <hr className="divider-glow" />
        {/* 4. Product Introduction */}
        <ProductIntro />
        {/* divider */}
        <hr className="divider-glow" />
        {/* 5. Features Section */}
        <CoreFeatures />
        {/* divider */}
        <hr className="divider-glow" />
        {/* 5. How It Works */}
        <HowItWorks />
        {/* 6. Supported Banks slider */}
        <SupportedBanks />
        {/* 6. Security */}
        <SecuritySection />
        {/* 7. Product Preview — Stats & Testimonials */}
        <ProductPreview />
        {/* divider */}
        <hr className="divider-glow" />
        {/* 8. Why Choose */}
        <WhyChoose />
        {/* 9. Final CTA */}
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
