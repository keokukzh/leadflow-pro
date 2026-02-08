import React, { FC } from 'react';
import { SiteConfig } from '@/lib/schemas';
import { motion } from 'framer-motion';

interface Props {
  data: SiteConfig['content']['hero'];
  theme: SiteConfig['theme'];
}

export const HeroImmersive: FC<Props> = ({ data, theme }) => {
  return (
    <section className="relative h-screen min-h-[700px] flex items-center justify-center text-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={`https://source.unsplash.com/1600x900/?${data.imageKeyword}`} 
          alt="Hero Immersive" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>
      </div>

      <div className="container px-6 relative z-10 max-w-4xl mx-auto">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 1, ease: "easeOut" }}
        >
          <div className={`inline-block mb-6 px-6 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-md text-white/90 text-sm font-medium tracking-widest uppercase ${theme.fontBody}`}>
            EST. 2024
          </div>
          
          <h1 className={`text-6xl md:text-8xl font-black text-white mb-8 tracking-tight leading-none ${theme.fontHeading}`}>
            {data.headline}
          </h1>
          
          <p className={`text-xl md:text-2xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed ${theme.fontBody}`}>
            {data.subheadline}
          </p>
          
          <button 
            className="px-10 py-5 bg-white text-black font-bold text-lg hover:scale-105 transition-transform"
            style={{ borderRadius: theme.radius }}
          >
            {data.ctaText}
          </button>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-white/50">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
      </div>
    </section>
  );
};
