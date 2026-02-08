import React, { FC } from 'react';
import { SiteConfig } from '@/lib/schemas';
import { motion } from 'framer-motion';

interface Props {
  data: SiteConfig['content']['hero'];
  theme: SiteConfig['theme'];
}

export const HeroSplit3D: FC<Props> = ({ data, theme }) => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-white text-slate-900">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50 z-0" style={{ borderBottomLeftRadius: theme.radius === '9999px' ? '40px' : theme.radius }}></div>
      
      <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-xl"
        >
          <div className={`inline-flex items-center px-4 py-1.5 rounded-full border border-slate-200 bg-white shadow-sm mb-8 ${theme.fontBody}`}>
            <span className="w-2 h-2 rounded-full mr-2 animate-pulse" style={{ backgroundColor: theme.accentColor }}></span>
            <span className="text-sm font-medium text-slate-600 tracking-wide uppercase">New Standard</span>
          </div>
          
          <h1 className={`text-5xl lg:text-7xl font-bold leading-[1.1] mb-8 ${theme.fontHeading}`} style={{ color: theme.primaryColor }}>
            {data.headline}
          </h1>
          
          <p className={`text-xl text-slate-500 mb-10 leading-relaxed ${theme.fontBody}`}>
            {data.subheadline}
          </p>
          
          <div className="flex flex-wrap gap-4">
            <button 
              className="px-8 py-4 rounded-xl text-white font-semibold text-lg hover:shadow-2xl transition-all hover:scale-105"
              style={{ backgroundColor: theme.primaryColor, borderRadius: theme.radius }}
            >
              {data.ctaText}
            </button>
            <button 
              className="px-8 py-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-lg hover:bg-slate-50 transition-all"
              style={{ borderRadius: theme.radius }}
            >
              Learn More
            </button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, rotateY: 15, scale: 0.9 }}
          animate={{ opacity: 1, rotateY: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, type: "spring" }}
          className="relative perspective-1000"
        >
           {/* Abstract Decorative Elements */}
           <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: theme.secondaryColor }}></div>
           <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: theme.accentColor }}></div>

           <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/20" style={{ borderRadius: theme.radius }}>
             <img 
               src={`https://source.unsplash.com/1600x900/?${data.imageKeyword}`} 
               alt="Hero Visual" 
               className="w-full h-auto object-cover"
             />
             <div className="absolute inset-0 bg-linear-to-tr from-black/20 to-transparent"></div>
           </div>
        </motion.div>
      </div>
    </section>
  );
};
