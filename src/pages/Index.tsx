import { Header } from "@/components/layout/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustBadges } from "@/components/landing/TrustBadges";
import { ProcessSection } from "@/components/landing/ProcessSection";
import { TreatmentShowcase } from "@/components/landing/TreatmentShowcase";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { Footer } from "@/components/landing/Footer";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <TrustBadges />
      <ProcessSection />
      <TreatmentShowcase />
      <TestimonialsSection />
      <AboutSection />
      <Footer />
    </div>
  );
}
