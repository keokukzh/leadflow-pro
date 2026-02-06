import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/settings';
import { performLeadResearch, generateSearchQueries, updateMission, getMissionById } from '@/lib/actions/server-actions';
import { searchLeadsWithPerplexity } from '@/lib/perplexity';

export async function POST(req: Request) {
  let missionId: string | undefined;
  try {
    const body = await req.json();
    const industry = body.industry;
    const locations = body.locations;
    missionId = body.missionId;
    const settings = await getSettings();
    const targetLocations = Array.isArray(locations) ? locations : [locations];

    if (missionId) {
      await updateMission(missionId, { status: 'IN_PROGRESS' });
    }

    // --- Perplexity Logic ---
    if (settings.discoveryProvider === 'perplexity') {
      console.log(`[SearchSpecialist] Running Perplexity Autonomous Search...`);
      const allPerplexityResults = [];
      
      for (const location of targetLocations) {
        try {
          const results = await searchLeadsWithPerplexity(industry, location);
          allPerplexityResults.push(...results);
          
          if (missionId) {
            await updateMission(missionId, { results: allPerplexityResults as any[] });
          }
        } catch (err) {
          console.error(`Perplexity search failed for ${location}:`, err);
        }
      }

      if (missionId) {
        await updateMission(missionId, { results: allPerplexityResults as any[], status: 'COMPLETED' });
      }

      return NextResponse.json({ results: allPerplexityResults });
    }

    const apiKey = settings.serpApiKey;
    const allResultsMap = new Map<string, any>();

    if (!apiKey) {
      // Mock for all requested cities
      const mockResults = targetLocations.map(loc => {
        const primaryIndustry = industry.split(",")[0].trim() || "Unternehmen";
        return {
          place_id: `mock-${loc}`,
          name: `${primaryIndustry} ${loc}`,
          rating: 4.8,
          user_ratings_total: 24,
          vicinity: loc,
          analysis: {
            priorityScore: 9,
            mainSentiment: 'Positiv',
            painPoints: [`Veraltete Online-Präsenz`, `Fehlende Buchungsmöglichkeit`],
            targetDecisionMaker: `Inhaber (${primaryIndustry})`,
            valueProposition: `Optimierte Kundenansprache und modernes Design für ${primaryIndustry}.`,
            outreachStrategy: `Direkte Ansprache der fehlenden digitalen Sichtbarkeit.`,
            conversationStarters: [
              `Ich habe Ihre tollen Google-Bewertungen gesehen, aber Kunden finden keine Website.`
            ]
          },
          website: null,
          simulated: true
        };
      });

      if (missionId) {
        await updateMission(missionId, { results: mockResults, status: 'COMPLETED' });
      }

      return NextResponse.json({ results: mockResults, isSimulated: true });
    }

    for (const location of targetLocations) {
      console.log(`[SearchSpecialist] Generating strategy for ${industry} in ${location}...`);
      const queries = await generateSearchQueries(industry, location);
      console.log(`[SearchSpecialist] Executing ${queries.length} optimized queries...`);

      for (const query of queries) {
        // Check if mission was stopped externally
        if (missionId) {
          const currentMission = await getMissionById(missionId);
          if (currentMission?.status !== 'IN_PROGRESS') {
            console.log(`[SearchSpecialist] Mission ${missionId} stopped or changed status. Breaking loop.`);
            return NextResponse.json({ results: Array.from(allResultsMap.values()).map(({ reviews_short: _, ...rest }) => rest) });
          }
        }

        const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(query)}&type=search&api_key=${apiKey}`;
        
        try {
          const response = await fetch(url);
          const data = await response.json();

          if (data.local_results) {
            const filtered = data.local_results.filter((res: { rating?: number; website?: string }) => 
               (res.rating && res.rating >= 4.0 || !res.rating) && !res.website
            );

            for (const res of filtered) {
              if (!allResultsMap.has(res.place_id)) {
                allResultsMap.set(res.place_id, {
                  place_id: res.place_id,
                  name: (res as any).title,
                  rating: (res as any).rating || 0,
                  user_ratings_total: (res as any).reviews || 0,
                  vicinity: (res as any).address,
                  website: null,
                  source_url: `https://www.google.com/maps/place/?q=place_id:${res.place_id}`,
                  reviews_short: (res as any).reviews_short,
                  query_source: query
                });
              }
            }
          }
        } catch (err) {
          console.error(`Query failed: ${query}`, err);
        }
      }
      
      
      // Update intermediate results for persistence if user navigates away
      if (missionId) {
        const currentResults = Array.from(allResultsMap.values()).map(({ reviews_short, ...rest }: any) => rest);
        await updateMission(missionId, { results: currentResults as any });
      }
    }

    const resultsArray = Array.from(allResultsMap.values())
      .sort((a, b) => ((b.rating || 0) * (b.reviews || 0)) - ((a.rating || 0) * (a.reviews || 0)))
      .slice(0, 15);

    console.log(`[SearchSpecialist] Synthesizing deep research for top 3 leads...`);
    for (const res of resultsArray.slice(0, 3)) {
      if (res.reviews_short) {
        const reviewsText = res.reviews_short.map((r: any) => r.snippet).join(" | ");
        const leadContext = {
          company_name: res.name,
          industry: industry,
          location: res.vicinity
        };
        res.analysis = await performLeadResearch(leadContext, reviewsText);
      }
    }

    const finalResults = resultsArray.map(({ reviews_short: _, ...rest }) => rest);

    if (missionId) {
      await updateMission(missionId, { results: finalResults as any, status: 'COMPLETED' });
    }

    return NextResponse.json({ results: finalResults });

  } catch (error) {
    console.error("Discovery Search Error:", error);
    if (missionId) {
        await updateMission(missionId, { status: 'FAILED' });
    }
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
