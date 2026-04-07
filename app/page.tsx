import Navbar          from '@/components/layout/Navbar';
import Footer          from '@/components/layout/Footer';
import Hero            from '@/components/sections/Hero';
import TrustStrip      from '@/components/sections/TrustStrip';
import WhatIsCoinsensei from '@/components/sections/WhatIsCoinsensei';
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
      <main>
        {/* 1. Hero */}
        <Hero />
        {/* 2. Trust Strip */}
        <TrustStrip />
        {/* 3. What is CoinSensei */}
        <WhatIsCoinsensei />
        {/* divider */}
        <hr className="divider-glow" />
        {/* 4. Core Features */}
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
