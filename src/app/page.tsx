import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Hero } from "@/screens/hero";
import { Marquee } from "@/screens/marquee";
import { Metrics } from "@/screens/metrics";
import { ServicesSection } from "@/screens/services";
import { ProcessSection } from "@/screens/process";
import { WorkSection } from "@/screens/work";
import { SignalsSection } from "@/screens/testimonials";
import { ContactCta } from "@/screens/cta";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <Hero />
        <Marquee />
        <Metrics />
        <ServicesSection />
        <ProcessSection />
        <WorkSection />
        <SignalsSection />
        <ContactCta />
      </main>
      <SiteFooter />
    </>
  );
}