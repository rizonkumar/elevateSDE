import type { Metadata } from 'next';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/marketing/Hero';
import { StatsBand } from '../components/marketing/StatsBand';
import { BentoFeatures } from '../components/marketing/BentoFeatures';
import { ProductShowcase } from '../components/marketing/ProductShowcase';
import { RoleSplit } from '../components/marketing/RoleSplit';
import { HowItWorks } from '../components/marketing/HowItWorks';
import { Pricing } from '../components/marketing/Pricing';
import { CtaSection } from '../components/marketing/CtaSection';
import { SiteFooter } from '../components/marketing/SiteFooter';

export const metadata: Metadata = {
  title: 'ElevateSDE — Interview Readiness for Software Engineers',
  description:
    'Turn tracked applications into deadline-aware interview plans with round-level evidence, coding practice, resume analysis, mock interviews, and private peer feedback.',
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-(--color-bg) text-(--color-text-primary) transition-colors duration-200">
      <Navbar wide />
      <main className="flex-1">
        <Hero />
        <div className="pb-12">
          <StatsBand />
        </div>
        <BentoFeatures />
        <ProductShowcase />
        <RoleSplit />
        <HowItWorks />
        <Pricing />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}
