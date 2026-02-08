import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/settings';
import { 
  searchGoogleMaps, 
  filterLeadCandidates, 
  transformToLeadFormat,
} from '@/lib/apify-client';
import { 
  performLeadResearch, 
  updateMission, 
  getMissionById 
} from '@/lib/actions/server-actions';

/**
 * POST /api/discovery/apify
 * 
 * Apify-powered lead discovery using Google Maps scraper
 * Falls back to mock data if Apify token is not configured
 */
export async function POST(req: Request) {
  let missionId: string | undefined;
  
  try {
    const body = await req.json();
    const industry = body.industry;
    const locations = body.locations;
    missionId = body.missionId;
    
    const settings = await getSettings();
    const hasApifyToken = !!settings.apifyToken;

    if (missionId) {
      await updateMission(missionId, { status: 'IN_PROGRESS' });
    }

    const targetLocations = Array.isArray(locations) ? locations : [locations];
    const allResults: ReturnType<typeof transformToLeadFormat>[] = [];

    if (!hasApifyToken) {
      // Mock data for development without Apify token
      console.log('[ApifyDiscovery] No Apify token - returning mock data');
      
      const mockResults = targetLocations.map(loc => {
        const primaryIndustry = industry.split(",")[0].trim() || "Unternehmen";
        return {
          place_id: `apify-mock-${loc}-${Date.now()}`,
          name: `${primaryIndustry} ${loc}`,
          rating: 4.7,
          user_ratings_total: 32,
          vicinity: loc,
          website: null,
          phone: '+49 123 456789',
          source_url: `https://www.google.com/maps`,
          industry: primaryIndustry,
          analysis: {
            priorityScore: 8,
            mainSentiment: 'Positiv',
            painPoints: ['Keine Online-Präsenz', 'Veraltete Kontaktdaten'],
            targetDecisionMaker: `Inhaber (${primaryIndustry})`,
            valueProposition: `Moderne Website für bessere Kundenakquise.`,
            outreachStrategy: `Direkte Ansprache der fehlenden digitalen Sichtbarkeit.`,
            conversationStarters: [
              `Ich habe Ihr Unternehmen auf Google Maps gefunden, aber keine Website.`
            ]
          },
          simulated: true
        };
      });

      if (missionId) {
        await updateMission(missionId, { results: mockResults as any, status: 'COMPLETED' });
      }

      return NextResponse.json({ results: mockResults, isSimulated: true });
    }

    // Process each location with Apify
    for (const location of targetLocations) {
      console.log(`[ApifyDiscovery] Searching: ${industry} in ${location}`);
      
      // Check if mission was stopped
      if (missionId) {
        const currentMission = await getMissionById(missionId);
        if (currentMission?.status !== 'IN_PROGRESS') {
          console.log(`[ApifyDiscovery] Mission stopped. Returning partial results.`);
          break;
        }
      }

      const searchResult = await searchGoogleMaps(industry, location, {
        maxResults: 25,
        language: 'de',
      });

      if (!searchResult.success || !searchResult.results) {
        console.error(`[ApifyDiscovery] Search failed for ${location}:`, searchResult.error);
        continue;
      }

      // Filter for leads without websites with good ratings
      const candidates = filterLeadCandidates(searchResult.results, {
        minRating: 4.0,
        requireNoWebsite: true,
      });

      console.log(`[ApifyDiscovery] Found ${candidates.length} candidates in ${location}`);

      // Transform to LeadFlow format
      for (const candidate of candidates) {
        const lead = transformToLeadFormat(candidate, industry);
        
        // Avoid duplicate place_ids
        if (!allResults.some(r => r.place_id === lead.place_id)) {
          allResults.push(lead);
        }
      }

      // Update intermediate results
      if (missionId) {
        await updateMission(missionId, { results: allResults as any });
      }
    }

    // Sort by rating and limit
    const sortedResults = allResults
      .sort((a, b) => (b.rating * (b.user_ratings_total || 1)) - (a.rating * (a.user_ratings_total || 1)))
      .slice(0, 15);

    // Deep research for top 3 leads
    console.log(`[ApifyDiscovery] Running deep research on top 3 leads...`);
    
    for (const lead of sortedResults.slice(0, 3)) {
      const leadContext = {
        company_name: lead.name,
        industry: industry,
        location: lead.vicinity,
      };
      
      // For now, use a placeholder for reviews since Apify data may not include them
      const reviewsPlaceholder = `Business mit ${lead.user_ratings_total} Bewertungen und Rating ${lead.rating}`;
      
      const analysis = await performLeadResearch(leadContext, reviewsPlaceholder);
      (lead as any).analysis = analysis;
    }

    if (missionId) {
      await updateMission(missionId, { results: sortedResults as any, status: 'COMPLETED' });
    }

    return NextResponse.json({ results: sortedResults });

  } catch (error) {
    console.error("[ApifyDiscovery] Error:", error);
    
    if (missionId) {
      await updateMission(missionId, { status: 'FAILED' });
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Discovery failed" }, 
      { status: 500 }
    );
  }
}
