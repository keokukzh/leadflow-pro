import React, { FC } from 'react';
import { SiteConfig } from '@/lib/schemas';

// Hero Variants
import { HeroSplit3D } from './sections/Hero/HeroSplit3D';
import { HeroImmersive } from './sections/Hero/HeroImmersive';

// Feature Variants
import { BentoGrid } from './sections/Features/BentoGrid';

interface Props {
  config: SiteConfig;
}

export const DynamicRenderer: FC<Props> = ({ config }) => {
  const { theme, content, structure } = config;

  // Render Hero
  const renderHero = () => {
    switch (structure.hero.variant) {
      case 'immersive-image':
        return <HeroImmersive data={content.hero} theme={theme} />;
      case 'split-3d':
      default:
        return <HeroSplit3D data={content.hero} theme={theme} />;
    }
  };

  // Render Features
  const renderFeatures = () => {
    switch (structure.features.variant) {
      case 'bento-box':
      default:
        return <BentoGrid data={content.services} theme={theme} />;
    }
  };

  return (
    <div className={`min-h-screen bg-white ${theme.fontBody}`}>
      {/* Dynamic Font Loading would go here or in layout */}
      
      {/* Header / Nav (Simplified for now) */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center">
         <div className={`text-xl font-bold ${theme.fontHeading}`}>{content.businessName}</div>
         <button className="px-5 py-2 text-sm font-medium text-white rounded-lg transition-opacity hover:opacity-90" style={{ backgroundColor: theme.primaryColor, borderRadius: theme.radius }}>
            Contact
         </button>
      </nav>

      <main>
        {renderHero()}
        {renderFeatures()}
        
        {/* Placeholder for Sections not yet migrated */}
        <section className="py-20 text-center text-gray-400">
           <p>Creating customized content for {config.vibe}...</p>
        </section>
      </main>

      {/* Simple Footer */}
      <footer className="py-8 text-center text-slate-400 text-sm border-t border-slate-100">
        © {new Date().getFullYear()} {content.businessName}. Powered by LeadFlow Pro.
      </footer>
    </div>
  );
};
