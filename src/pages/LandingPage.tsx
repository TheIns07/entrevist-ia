import MarketingHeader from "../components/MarketingHeader";
import HeroSection from "../components/landing/HeroSection";
import ProblemSection from "../components/landing/ProblemSection";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import StepsSection from "../components/landing/StepsSection";
import TestimonialSection from "../components/landing/TestimonialSection";
import FinalCTASection from "../components/landing/FinalCTASection";
import MarketingFooter from "../components/landing/MarketingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingHeader />

      <main>
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <StepsSection />
        <TestimonialSection />
        <FinalCTASection />
      </main>

      <MarketingFooter />
    </div>
  );
}