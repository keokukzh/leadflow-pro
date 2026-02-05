import React from 'react';
import { Star } from 'lucide-react';

interface Review {
  author: string;
  text: string;
  rating: number;
}

interface ReviewsBlockProps {
  title: string;
  reviews: Review[];
  accentColor: string;
}

export function ReviewsBlock({ title, reviews, accentColor }: ReviewsBlockProps) {
  return (
    <section className="py-24 px-6 bg-slate-950">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-16">{title}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {reviews.map((review, i) => (
            <div key={i} className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, starIdx) => (
                  <Star 
                    key={starIdx} 
                    className={`w-4 h-4 ${starIdx < review.rating ? "fill-current" : "text-slate-700"}`}
                    style={{ color: starIdx < review.rating ? accentColor : undefined }}
                  />
                ))}
              </div>
              <p className="text-slate-300 italic mb-6 leading-relaxed">
                &quot;{review.text}&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700" />
                <span className="font-bold text-white">{review.author}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
