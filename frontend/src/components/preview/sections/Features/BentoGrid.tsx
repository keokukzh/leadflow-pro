import React, { FC } from 'react';
import { SiteConfig } from '@/lib/schemas';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';

interface Props {
  data: SiteConfig['content']['services'];
  theme: SiteConfig['theme'];
}

export const BentoGrid: FC<Props> = ({ data, theme }) => {
  return (
    <section className="py-24 px-6 bg-slate-50">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className={`text-4xl md:text-5xl font-bold mb-4 text-slate-900 ${theme.fontHeading}`}>
            {data.title}
          </h2>
          <div className="w-20 h-1.5 mx-auto rounded-full" style={{ backgroundColor: theme.secondaryColor }}></div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 auto-rows-[minmax(200px,auto)]">
          {data.items.map((item, idx) => {
            // Dynamic Lucide Icon
            // Create a safe lookup for icons to avoid TS errors
            const IconLookup: Record<string, React.ElementType> = Icons as any;
            const IconComponent = IconLookup[item.icon] || Icons.Star;
            
            // Layout Pattern: Some items span 2 cols to create "Bento" look
            const isWide = idx === 0 || idx === 3;
            
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`group relative p-8 bg-white border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden ${isWide ? 'md:col-span-2' : ''}`}
                style={{ borderRadius: theme.radius }}
              >
                 <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                    <IconComponent className="w-32 h-32" style={{ color: theme.primaryColor }} />
                 </div>
                 
                 <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="mb-6 w-12 h-12 rounded-xl flex items-center justify-center bg-slate-50 group-hover:bg-slate-100 transition-colors" style={{ color: theme.primaryColor }}>
                        <IconComponent className="w-6 h-6" />
                    </div>
                    
                    <div>
                        <h3 className={`text-xl font-bold mb-3 text-slate-900 group-hover:text-black ${theme.fontHeading}`}>
                            {item.title}
                        </h3>
                        <p className={`text-slate-500 leading-relaxed ${theme.fontBody}`}>
                            {item.description}
                        </p>
                    </div>
                 </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
