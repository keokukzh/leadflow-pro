import { getSettings } from "./settings";

export interface BraveSearchLead {
  place_id: string;
  name: string;
  vicinity: string;
  website: string | null;
  source_url: string;
  industry: string;
  rating?: number;
  user_ratings_total?: number;
  // Brave doesn't give analysis, so we might need to mock or derive it? 
  // actually snake_case matches our other interfaces better or we map it later?
  // Let's match PerplexityLead interface for consistency if possible, or make a generic one.
  // actually route.ts expects specific fields.
}

interface BraveWebResult {
  title: string;
  url: string;
  description: string;
  profile?: {
    name: string;
    long_name: string;
    img: string;
  }
}

export async function searchLeadsWithBrave(industry: string, location: string): Promise<any[]> {
  const settings = await getSettings();
  if (!settings.braveApiKey) {
    throw new Error("Brave Search API Key fehlt in den Einstellungen.");
  }

  // search for specific business listings or generic query
  const query = `${industry} ${location}`; 
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=20`;

  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "X-Subscription-Token": settings.braveApiKey
    }
  });

  if (!response.ok) {
    throw new Error(`Brave API Error: ${response.status}`);
  }

  const data = await response.json();
  const results = data.web?.results || [];

  return results.map((r: BraveWebResult) => {
    // Basic Filtering Logic already here to save processing downstream
    const name = r.title.replace(/ \|.*/, "").replace(/ - .*/, "").trim(); // Clean title

    return {
      place_id: `brave-${Buffer.from(r.url).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)}`,
      name: name,
      vicinity: location, // Brave doesn't give address usually in web search
      website: r.url,
      source_url: r.url,
      industry: industry,
      rating: 0, // Brave doesn't give ratings
      user_ratings_total: 0,
      analysis: {
        priorityScore: 5,
        mainSentiment: 'Neutral',
        painPoints: ['Web-Präsenz prüfen'],
        targetDecisionMaker: 'Inhaber',
        valueProposition: 'Optimierungspotential',
        outreachStrategy: 'Direktkontakt',
        conversationStarters: [`Ich habe Sie über ${name} gefunden.`]
      }
    };
  });
}
