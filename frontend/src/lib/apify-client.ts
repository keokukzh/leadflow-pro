import { ApifyClient } from 'apify-client';
import { getSettings } from './settings';

// Actor IDs for different discovery tasks
export const APIFY_ACTORS = {
  GOOGLE_MAPS_SCRAPER: 'compass/crawler-google-places',
  CONTACT_INFO_SCRAPER: 'apify/contact-info-scraper',
  WEBSITE_CHECKER: 'apify/website-checker',
  WEB_SCRAPER: 'apify/web-scraper',
} as const;

export type ApifyActorId = typeof APIFY_ACTORS[keyof typeof APIFY_ACTORS];

// Types for Google Maps Scraper results
export interface GoogleMapsResult {
  title: string;
  address: string;
  website?: string | null;
  phone?: string;
  totalScore?: number;
  reviewsCount?: number;
  url: string;
  placeId: string;
  categories?: string[];
  openingHours?: string[];
}

// Types for Contact Info Scraper results
export interface ContactInfoResult {
  url: string;
  emails: string[];
  phones: string[];
  linkedIns: string[];
  twitters: string[];
  instagrams: string[];
  facebooks: string[];
}

// Types for Website Checker results
export interface WebsiteCheckResult {
  url: string;
  isLive: boolean;
  statusCode?: number;
  title?: string;
  description?: string;
  responseTimeMs?: number;
}

/**
 * Get configured Apify client instance
 */
export async function getApifyClient(): Promise<ApifyClient | null> {
  const settings = await getSettings();
  const token = settings.apifyToken;
  
  if (!token) {
    console.warn('[ApifyClient] No Apify token configured');
    return null;
  }
  
  return new ApifyClient({ token });
}

/**
 * Run an Apify Actor and wait for results
 */
export async function runActor<T = unknown>(
  actorId: string,
  input: Record<string, unknown>,
  options: {
    timeout?: number;
    maxItems?: number;
  } = {}
): Promise<{ success: boolean; data?: T[]; error?: string }> {
  const client = await getApifyClient();
  
  if (!client) {
    return { success: false, error: 'Apify token not configured' };
  }
  
  try {
    console.log(`[ApifyClient] Starting Actor: ${actorId}`);
    
    const run = await client.actor(actorId).call(input);
    
    console.log(`[ApifyClient] Actor run started: ${run.id}`);
    
    // Wait for completion
    await client.run(run.id).waitForFinish();
    
    // Get dataset items
    const { items } = await client.dataset(run.defaultDatasetId!).listItems({
      limit: options.maxItems || 100,
    });
    
    console.log(`[ApifyClient] Actor completed with ${items.length} results`);
    
    return { success: true, data: items as T[] };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ApifyClient] Actor error:`, message);
    return { success: false, error: message };
  }
}

/**
 * Search Google Maps for businesses using Apify
 */
export async function searchGoogleMaps(
  query: string,
  location: string,
  options: {
    maxResults?: number;
    language?: string;
  } = {}
): Promise<{ success: boolean; results?: GoogleMapsResult[]; error?: string }> {
  const searchQuery = `${query} in ${location}`;
  
  const result = await runActor<GoogleMapsResult>(
    APIFY_ACTORS.GOOGLE_MAPS_SCRAPER,
    {
      searchStringsArray: [searchQuery],
      maxCrawledPlacesPerSearch: options.maxResults || 20,
      language: options.language || 'de',
      maxImages: 0,
      maxReviews: 5,
      onlyDataFromSearchPage: false,
    },
    { maxItems: options.maxResults || 20 }
  );
  
  if (!result.success) {
    return { success: false, error: result.error };
  }
  
  return { success: true, results: result.data };
}

/**
 * Check if a website is live and get basic info
 */
export async function checkWebsite(
  url: string
): Promise<{ success: boolean; result?: WebsiteCheckResult; error?: string }> {
  const result = await runActor<WebsiteCheckResult>(
    APIFY_ACTORS.WEBSITE_CHECKER,
    {
      startUrls: [{ url }],
    },
    { maxItems: 1 }
  );
  
  if (!result.success) {
    return { success: false, error: result.error };
  }
  
  return { success: true, result: result.data?.[0] };
}

/**
 * Scrape contact info from a website
 */
export async function scrapeContactInfo(
  url: string
): Promise<{ success: boolean; result?: ContactInfoResult; error?: string }> {
  const result = await runActor<ContactInfoResult>(
    APIFY_ACTORS.CONTACT_INFO_SCRAPER,
    {
      startUrls: [{ url }],
      maxDepth: 2,
    },
    { maxItems: 1 }
  );
  
  if (!result.success) {
    return { success: false, error: result.error };
  }
  
  return { success: true, result: result.data?.[0] };
}

/**
 * Filter Google Maps results to find businesses without websites
 */
export function filterLeadCandidates(
  results: GoogleMapsResult[],
  options: {
    minRating?: number;
    requireNoWebsite?: boolean;
  } = {}
): GoogleMapsResult[] {
  return results.filter(result => {
    // Check rating threshold
    if (options.minRating && result.totalScore && result.totalScore < options.minRating) {
      return false;
    }
    
    // Check website requirement
    if (options.requireNoWebsite && result.website) {
      return false;
    }
    
    return true;
  });
}

/**
 * Transform Apify Google Maps result to LeadFlow format
 */
export function transformToLeadFormat(result: GoogleMapsResult, industry: string) {
  return {
    place_id: result.placeId,
    name: result.title,
    rating: result.totalScore || 0,
    user_ratings_total: result.reviewsCount || 0,
    vicinity: result.address,
    website: result.website || null,
    phone: result.phone || null,
    source_url: result.url,
    industry,
  };
}
