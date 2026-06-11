import { Hero } from "@/components/home/Hero";
import { Ticker } from "@/components/home/Ticker";
import { Vision } from "@/components/home/Vision";
import { Tokenization } from "@/components/home/Tokenization";
import { ProductIntro } from "@/components/home/ProductIntro";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { WhyCoinsensei } from "@/components/home/WhyCoinsensei";
import { HowItWorks } from "@/components/home/HowItWorks";
import { TrustSecurity } from "@/components/home/TrustSecurity";
import { WaitlistSection } from "@/components/home/WaitlistSection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Ticker />
      <Vision />
      <Tokenization />
      <ProductIntro />
      <FeaturesSection />
      <WhyCoinsensei />
      <HowItWorks />
      <TrustSecurity />
      <Ticker reverse />
      <WaitlistSection />
    </>
  );
}
