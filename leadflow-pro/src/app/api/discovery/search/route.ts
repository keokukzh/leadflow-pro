import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/settings';
import { searchLeadsWithPerplexity } from '@/lib/perplexity';
import { apiRateLimit } from '@/lib/rate-limit';
import { SearchDiscoverySchema, ApiResponse, SearchDiscoveryData } from '@/lib/schemas';
import { performLeadResearch, generateSearchQueries, updateMission, getMissionById, DiscoveryMission } from '@/lib/actions/server-actions';
import { logger } from '@/lib/logger';

/**
 * @env PERPLEXITY_API_KEY
 * @env NEXT_PUBLIC_SUPABASE_URL
 * @throws {429} - Rate limit exceeded
 * @throws {400} - Validation error
 */
export async function POST(req: Request) {
  // 1. Rate Limiting Check
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';
  const { success: limitOk } = await apiRateLimit.check(req as any, 10, ip);
  if (!limitOk) {
    logger.warn({ ip }, "Rate limit exceeded for discovery search");
    return NextResponse.json<ApiResponse>({ success: false, error: "Zu viele Anfragen. Bitte warten Sie eine Minute." }, { status: 429 });
  }

  let missionId: string | undefined;
  try {
    const jsonBody = await req.json();
    
    // 2. Input Validation
    const validation = SearchDiscoverySchema.safeParse(jsonBody);
    if (!validation.success) {
      logger.error({ errors: validation.error.errors }, "Validation failed for discovery search");
      return NextResponse.json<ApiResponse>({ 
        success: false, 
        error: "Validierungsfehler: " + validation.error.errors.map(e => e.message).join(", ") 
      }, { status: 400 });
    }

    const { industry, locations, missionId: mId } = validation.data as SearchDiscoveryData;
    missionId = mId;
    
    logger.info({ industry, locations, missionId }, "Starting discovery search mission");
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
            await updateMission(missionId, { results: allPerplexityResults as DiscoveryMission['results'] });
          }
        } catch (err) {
          console.error(`Perplexity search failed for ${location}:`, err);
        }
      }

      if (missionId) {
        await updateMission(missionId, { results: allPerplexityResults as DiscoveryMission['results'], status: 'COMPLETED' });
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
            return NextResponse.json({ results: Array.from(allResultsMap.values()).map((res) => {
              const rest = { ...res };
              delete (rest as Record<string, unknown>).reviews_short;
              return rest;
            }) });
          }
        }

        const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(query)}&type=search&api_key=${apiKey}`;
        
        try {
          const response = await fetch(url);
          const data = await response.json() as Record<string, unknown>;

          if (data.local_results) {
            const results = data.local_results as Array<Record<string, unknown>>;
            const filtered = results.filter((res) => 
               (res.rating && (res.rating as number) >= 4.0 || !res.rating) && !res.website
            );

            for (const res of filtered) {
              if (!allResultsMap.has(res.place_id as string)) {
                allResultsMap.set(res.place_id as string, {
                  place_id: res.place_id,
                  name: res.title,
                  rating: res.rating || 0,
                  user_ratings_total: res.reviews || 0,
                  vicinity: res.address,
                  website: null,
                  source_url: `https://www.google.com/maps/place/?q=place_id:${res.place_id}`,
                  reviews_short: res.reviews_short,
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
        const currentResults = Array.from(allResultsMap.values()).map((res) => {
          // Exclude reviews_short from persisted data to save space/memory
          const rest = { ...res };
          delete (rest as Record<string, unknown>).reviews_short;
          return rest;
        });
        await updateMission(missionId, { results: currentResults as DiscoveryMission['results'] });
      }
    }

    const resultsArray = Array.from(allResultsMap.values())
      .sort((a, b) => ((b.rating || 0) * (b.user_ratings_total || 0)) - ((a.rating || 0) * (a.user_ratings_total || 0)))
      .slice(0, 15);

    console.log(`[SearchSpecialist] Synthesizing deep research for top 3 leads...`);
    for (const res of resultsArray.slice(0, 3)) {
      if (res.reviews_short) {
        const reviewsText = (res.reviews_short as Array<Record<string, string>>).map((r) => r.snippet).join(" | ");
        const leadContext = {
          company_name: res.name as string,
          industry: industry,
          location: res.vicinity as string
        };
        res.analysis = await performLeadResearch(leadContext, reviewsText);
      }
    }

    const finalResults = resultsArray.map((res) => {
      const rest = { ...res };
      delete (rest as Record<string, unknown>).reviews_short;
      return rest;
    });

    if (missionId) {
      await updateMission(missionId, { results: finalResults as DiscoveryMission['results'], status: 'COMPLETED' });
    }

    return NextResponse.json<ApiResponse>({ success: true, data: { results: finalResults } });

  } catch (error) {
    console.error("Discovery Search Error:", error);
    if (missionId) {
        await updateMission(missionId, { status: 'FAILED' });
    }
    return NextResponse.json<ApiResponse>({ success: false, error: "Suche fehlgeschlagen" }, { status: 500 });
  }
}
