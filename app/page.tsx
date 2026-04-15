import HeroSection from "@/components/sections/Hero";
import MetricsBar from "@/components/sections/MetricsBar";
import ProblemSection from "@/components/sections/Problem";
import HowItWorksSection from "@/components/sections/HowItWorks";
import TechStackSection from "@/components/sections/TechStack";
import ComparisonSection from "@/components/sections/Comparison";
import OpenProtocolSection from "@/components/sections/OpenProtocol";
import FooterSection from "@/components/sections/Footer";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <hr className="section-rule" />
      <MetricsBar />
      <hr className="section-rule" />
      <ProblemSection />
      <hr className="section-rule" />
      <HowItWorksSection />
      <hr className="section-rule" />
      <TechStackSection />
      <hr className="section-rule" />
      <ComparisonSection />
      <hr className="section-rule" />
      <OpenProtocolSection />
      <hr className="section-rule" />
      <FooterSection />
    </main>
  );
}
