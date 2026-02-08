export interface LeadScoreResult {
  score: number;
  label: 'HOT' | 'WARM' | 'COLD';
  breakdown: {
    reviews: number;
    stars: number;
    websiteFactor: number;
    industryFactor: number;
  };
}

export function calculateLeadScore(
  reviews: number,
  stars: number,
  websiteStatus: 'KEINE' | 'VERALTET' | 'MODERN',
  industry: string
): LeadScoreResult {
  const reviewsScore = reviews * 10;
  const starsScore = stars * 15;

  let websiteFactor = 0;
  switch (websiteStatus) {
    case 'KEINE':
      websiteFactor = 30;
      break;
    case 'VERALTET':
      websiteFactor = 15;
      break;
    case 'MODERN':
      websiteFactor = -10;
      break;
  }

  let industryFactor = 0;
  const industryLower = industry.toLowerCase();
  
  if (industryLower.includes('restaurant') || industryLower.includes('gastro')) {
    industryFactor = 20;
  } else if (industryLower.includes('handwerk') || industryLower.includes('bau') || industryLower.includes('schreiner') || industryLower.includes('elektriker')) {
    industryFactor = 20;
  } else if (industryLower.includes('beauty') || industryLower.includes('coiffeur') || industryLower.includes('salon')) {
    industryFactor = 15;
  } else if (industryLower.includes('medical') || industryLower.includes('arzt') || industryLower.includes('praxis')) {
    industryFactor = 25;
  } else if (industryLower.includes('retail') || industryLower.includes('laden') || industryLower.includes('shop')) {
    industryFactor = 10;
  }

  const totalScore = reviewsScore + starsScore + websiteFactor + industryFactor;

  let label: 'HOT' | 'WARM' | 'COLD' = 'COLD';
  if (totalScore >= 70) {
    label = 'HOT';
  } else if (totalScore >= 40) {
    label = 'WARM';
  }

  return {
    score: totalScore,
    label,
    breakdown: {
      reviews: reviewsScore,
      stars: starsScore,
      websiteFactor,
      industryFactor,
    },
  };
}
