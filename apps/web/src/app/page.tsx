import { Navbar } from '../components/Navbar';
import { Hero } from '../components/marketing/Hero';
import { StatsBand } from '../components/marketing/StatsBand';
import { FeatureGrid } from '../components/marketing/FeatureGrid';
import { HowItWorks } from '../components/marketing/HowItWorks';
import { CtaSection } from '../components/marketing/CtaSection';
import { SiteFooter } from '../components/marketing/SiteFooter';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-(--color-bg) text-(--color-text-primary) transition-colors duration-200">
      <Navbar wide />
      <main className="flex-1">
        <Hero />
        <StatsBand />
        <FeatureGrid />
        <HowItWorks />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}
