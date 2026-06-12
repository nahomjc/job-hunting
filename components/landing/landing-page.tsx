"use client";

import { LandingNav } from "./landing-nav";
import { HeroSection } from "./hero-section";
import { HowItWorksSection } from "./how-it-works-section";
import { FeaturesSection } from "./features-section";
import { PricingSection } from "./pricing-section";
import { TestimonialsSection } from "./testimonials-section";
import { FaqSection } from "./faq-section";
import { CtaSection, LandingFooter } from "./landing-footer";
import type { NavUser } from "./user-nav-menu";

interface LandingPageProps {
  user?: NavUser | null;
}

export function LandingPage({ user = null }: LandingPageProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingNav user={user} />
      <main className="flex-1">
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <PricingSection />
        <TestimonialsSection />
        <FaqSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
