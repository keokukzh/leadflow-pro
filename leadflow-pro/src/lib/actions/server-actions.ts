"use server";

import { revalidatePath } from "next/cache";
import { readData, writeData } from "../storage";
import { getCompletion } from "../ai-client";
import { TEMPLATE_DATA_PROMPT, SEARCH_STRATEGY_PROMPT, BOTTIE_SYSTEM_PROMPT } from "../prompts";
import { calculateLeadScore } from "@/services/leadScoring";
import { logger } from "@/lib/logger";

// In a real app, you would use Prisma, Drizzle, or raw pg queries
export interface Interaction {
  id: string;
  lead_id: string;
  interaction_type: 'EMAIL' | 'CALL';
  content: string;
  status: string;
  created_at: string;
}

export interface DiscoveryResultItem {
  place_id: string;
  name: string;
  rating: number;
  user_ratings_total: number;
  vicinity: string;
  website?: string | null;
  phone?: string | null;
  source_url?: string;
  industry: string;
  analysis?: NonNullable<Lead['analysis']>;
}

export interface TemplateData {
  businessName: string;
  industry: string;
  layoutType?: 'modern-split' | 'minimal-soft' | 'emotional-dark' | 'clean-professional';
  primaryColor: string;
  secondaryColor: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroImageUrl: string;
  usps: {
    title: string;
    description: string;
  }[];
  reviewScore: string;
  reviewCount: number;
  location: string;
  phoneNumber: string;
}

export interface Lead {
  id: string;
  company_name: string;
  website: string | null;
  industry: string;
  location: string;
  rating: number;
  review_count: number;
  status: 'DISCOVERED' | 'STRATEGY_GENERATING' | 'STRATEGY_CREATED' | 'PREVIEW_GENERATING' | 'PREVIEW_READY' | 'CONTACTED' | 'WON' | 'LOST';
  strategy_brief?: {
    brandTone: string;
    keySells: string[];
    colorPalette: { name: string; hex: string }[];
    layoutType?: 'modern-split' | 'minimal-soft' | 'emotional-dark' | 'clean-professional';
    creationToolPrompt?: string;
  };
  analysis?: {
    priorityScore: number;
    mainSentiment: string;
    painPoints: string[];
    targetDecisionMaker: string;
    valueProposition: string;
    outreachStrategy: string;
    conversationStarters: string[];
  } | null;
  preview_data?: TemplateData | null;
  created_at: string;
}

export interface DiscoveryMission {
  id: string;
  industry: string;
  locations: string[];
  currentLocationIndex: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'STOPPED';
  results: {
    place_id: string;
    name: string;
    rating: number;
    user_ratings_total: number;
    vicinity: string;
    website?: string | null;
    source_url?: string;
    analysis?: {
      priorityScore: number;
      mainSentiment: string;
      painPoints: string[];
      targetDecisionMaker: string;
      valueProposition: string;
      outreachStrategy: string;
      conversationStarters: string[];
    };
  }[];
  created_at: string;
}

const LEADS_FILE = 'leads.json';
const INTERACTIONS_FILE = 'interactions.json';
const MISSIONS_FILE = 'missions.json';

import { LEAD_RESEARCH_PROMPT, LeadContext } from "../prompts";
import { 
  searchGoogleMaps, 
  filterLeadCandidates, 
  transformToLeadFormat,
  scrapeContactInfo,
  checkWebsite 
} from "../apify-client";
import { getSettings } from "../settings";

/**
 * Run Apify-powered discovery for leads
 */
export async function runApifyDiscovery(
  industry: string, 
  location: string, 
  options: { maxResults?: number } = {}
): Promise<{ success: boolean; results?: DiscoveryResultItem[]; error?: string }> {
  const settings = await getSettings();
  
  if (!settings.apifyToken) {
    return { success: false, error: 'Apify token not configured' };
  }
  
  const searchResult = await searchGoogleMaps(industry, location, {
    maxResults: options.maxResults || 20,
    language: 'de',
  });
  
  if (!searchResult.success || !searchResult.results) {
    logger.error({ error: searchResult.error }, "Apify Google Maps search failed");
    return { success: false, error: searchResult.error };
  }
  
  const candidates = filterLeadCandidates(searchResult.results, {
    minRating: 4.0,
    requireNoWebsite: true,
  });
  
  const leads = candidates.map(c => {
    const data = transformToLeadFormat(c, industry);
    // Initial scoring
    const scoring = calculateLeadScore(
      data.user_ratings_total,
      data.rating,
      data.website ? 'MODERN' : 'KEINE', // Basic assumption for now
      data.industry
    );
    
    return {
      ...data,
      analysis: {
        priorityScore: scoring.score,
        mainSentiment: 'Analysiere...',
        painPoints: [],
        targetDecisionMaker: 'Inhaber',
        valueProposition: '',
        outreachStrategy: `Priorität: ${scoring.label}`,
        conversationStarters: []
      }
    } as DiscoveryResultItem;
  });
  
  return { success: true, results: leads };
}

/**
 * Enrich a lead with additional data from Apify
 */
export async function enrichLeadWithApify(leadId: string): Promise<{ 
  success: boolean; 
  enrichedData?: {
    emails?: string[];
    phones?: string[];
    socialProfiles?: {
      linkedIn?: string;
      facebook?: string;
      instagram?: string;
    };
    websiteCheck?: {
      isLive: boolean;
      title?: string;
    };
  }; 
  error?: string 
}> {
  const settings = await getSettings();
  
  if (!settings.apifyToken) {
    return { success: false, error: 'Apify token not configured' };
  }
  
  const lead = await getLeadById(leadId);
  if (!lead) {
    return { success: false, error: 'Lead not found' };
  }
  
  const enrichedData: {
    emails?: string[];
    phones?: string[];
    socialProfiles?: {
      linkedIn?: string;
      facebook?: string;
      instagram?: string;
    };
    websiteCheck?: {
      isLive: boolean;
      title?: string;
    };
  } = {};
  
  // If they have a website, check it and scrape contact info
  if (lead.website) {
    const [websiteResult, contactResult] = await Promise.all([
      checkWebsite(lead.website),
      scrapeContactInfo(lead.website),
    ]);
    
    if (websiteResult.success && websiteResult.result) {
      enrichedData.websiteCheck = {
        isLive: websiteResult.result.isLive,
        title: websiteResult.result.title,
      };
    }
    
    if (contactResult.success && contactResult.result) {
      enrichedData.emails = contactResult.result.emails;
      enrichedData.phones = contactResult.result.phones;
      enrichedData.socialProfiles = {
        linkedIn: contactResult.result.linkedIns?.[0],
        facebook: contactResult.result.facebooks?.[0],
        instagram: contactResult.result.instagrams?.[0],
      };
    }
  }
  
  return { success: true, enrichedData };
}


export async function performLeadResearch(lead: LeadContext, reviewsText: string) {
  const prompt = LEAD_RESEARCH_PROMPT(lead, reviewsText);
  // Using gpt-4o for deep research as it requires high quality analysis
  const content = await getCompletion(prompt, BOTTIE_SYSTEM_PROMPT);
  try {
    return JSON.parse(content || '{}');
  } catch {
    return null;
  }
}

export async function generateSearchQueries(industry: string, location: string) {
  const prompt = SEARCH_STRATEGY_PROMPT(industry, location);
  // Using gpt-4o-mini for query generation as it is a simpler task
  const content = await getCompletion(prompt, "Du bist ein Search Specialist für B2B-Lead-Generierung.");
  try {
    const queries = JSON.parse(content || '[]');
    return Array.isArray(queries) ? queries : [`${industry} in ${location}`];
  } catch {
    return [`${industry} in ${location}`];
  }
}

export async function createDiscoveryMission(industry: string, locations: string[]) {
  const missions = await readData<DiscoveryMission[]>(MISSIONS_FILE, []);
  
  const newMission: DiscoveryMission = {
    id: Math.random().toString(36).substring(2, 9),
    industry,
    locations,
    currentLocationIndex: 0,
    status: 'PENDING',
    results: [],
    created_at: new Date().toISOString()
  };
  
  missions.push(newMission);
  await writeData(MISSIONS_FILE, missions);
  
  revalidatePath("/discovery");
  return newMission;
}

export async function getMissions() {
  return await readData<DiscoveryMission[]>(MISSIONS_FILE, []);
}

export async function getLatestMission() {
  const missions = await getMissions();
  if (missions.length === 0) return null;
  return missions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
}

export async function getMissionById(id: string) {
  const missions = await getMissions();
  return missions.find(m => m.id === id) || null;
}

export async function updateMission(missionId: string, updates: Partial<DiscoveryMission>) {
  logger.info({ missionId, updates }, "Updating discovery mission");
  const missions = await getMissions();
  const index = missions.findIndex(m => m.id === missionId);
  if (index !== -1) {
    missions[index] = { ...missions[index], ...updates };
    await writeData(MISSIONS_FILE, missions);
    revalidatePath("/discovery");
  }
}

export async function stopDiscoveryMission(missionId: string) {
  const missions = await getMissions();
  const index = missions.findIndex(m => m.id === missionId);
  if (index !== -1 && missions[index].status === 'IN_PROGRESS') {
    missions[index].status = 'STOPPED';
    await writeData(MISSIONS_FILE, missions);
    revalidatePath("/discovery");
  }
}

export async function saveLeadToCRM(leadData: { 
  name: string; 
  website?: string | null; 
  vicinity: string; 
  rating: number; 
  user_ratings_total: number;
  industry?: string;
}) {
  const leads = await readData<Lead[]>(LEADS_FILE, []);
  
  const scoring = calculateLeadScore(
    leadData.user_ratings_total,
    leadData.rating,
    leadData.website ? 'MODERN' : 'KEINE',
    leadData.industry || 'Sonstige'
  );

  const newLead: Lead = {
    id: Math.random().toString(36).substring(2, 9),
    company_name: leadData.name,
    industry: leadData.industry || 'Sonstige',
    website: leadData.website || null,
    location: leadData.vicinity,
    rating: leadData.rating,
    review_count: leadData.user_ratings_total,
    status: 'DISCOVERED',
    analysis: {
      priorityScore: scoring.score,
      mainSentiment: 'Aktiviert',
      painPoints: [],
      targetDecisionMaker: 'Inhaber',
      valueProposition: 'Potenzial für Lead-Steigerung durch Swiss Design Website.',
      outreachStrategy: `Kategorie: ${scoring.label}`,
      conversationStarters: []
    },
    created_at: new Date().toISOString()
  };
  
  leads.push(newLead);
  await writeData(LEADS_FILE, leads);
  
  revalidatePath("/memory");
  revalidatePath("/discovery");
  
  return { success: true, lead: newLead };
}


// Helper to safely get leads array regardless of return type
export async function getLeadsSafe(): Promise<Lead[]> {
  const result = await getLeads();
  // Safe runtime check for backward compatibility if getLeads signature changes
  if (result && typeof result === 'object' && 'leads' in result) {
    return result.leads;
  }
  return Array.isArray(result) ? result : [];
}

export async function getLeads(filters?: {
  status?: string;
  industry?: string;
  location?: string;
  search?: string;
  minScore?: number;
  maxScore?: number;
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'rating' | 'score';
  sortOrder?: 'asc' | 'desc';
}) {
  let leads = await readData<Lead[]>(LEADS_FILE, []);
  
  // Default sort by date desc if no filters or no sort specified
  if (!filters?.sortBy) {
    leads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  if (filters) {
    if (filters.status) leads = leads.filter(l => l.status === filters.status);
    if (filters.industry) leads = leads.filter(l => l.industry.toLowerCase().includes(filters.industry!.toLowerCase()));
    if (filters.location) leads = leads.filter(l => l.location.toLowerCase().includes(filters.location!.toLowerCase()));
    if (filters.search) {
      const s = filters.search.toLowerCase();
      leads = leads.filter(l => 
        l.company_name.toLowerCase().includes(s) ||
        l.industry.toLowerCase().includes(s) ||
        l.location.toLowerCase().includes(s)
      );
    }
    
    // Sort logic if specific sort requested
    if (filters.sortBy) {
        leads.sort((a, b) => {
          let comparison = 0;
          switch (filters.sortBy) {
            case 'created_at':
              comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
              break;
            case 'rating':
              comparison = a.rating - b.rating;
              break;
            case 'score':
              comparison = (a.analysis?.priorityScore || 0) - (b.analysis?.priorityScore || 0);
              break;
          }
          return filters.sortOrder === 'desc' ? -comparison : comparison;
        });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const start = (page - 1) * limit;
    
    return {
      leads: leads.slice(start, start + limit),
      total: leads.length,
      page,
      totalPages: Math.ceil(leads.length / limit)
    };
  }
  
  return {
      leads,
      total: leads.length,
      page: 1,
      totalPages: 1
  };
}

export async function getLeadById(id: string) {
  const leads = await getLeadsSafe();
  return leads.find(l => l.id === id);
}

export async function createLead(companyName: string, industry: string, location: string, website: string | null = null) {
    const leads = await getLeadsSafe();
    
    // Check for duplicates
    if (leads.some(l => l.company_name.toLowerCase() === companyName.toLowerCase())) {
        return { success: false, error: "Lead already exists" };
    }

    const newLead: Lead = {
      id: crypto.randomUUID(),
      company_name: companyName,
      website,
      industry,
      location,
      rating: 0,
      review_count: 0,
      status: 'DISCOVERED',
      created_at: new Date().toISOString()
    };
    
    await writeData(LEADS_FILE, [...leads, newLead]);
    revalidatePath("/dashboard");
    revalidatePath("/memory");
    return { success: true, lead: newLead };
}

export async function logInteraction(leadId: string, type: 'EMAIL' | 'CALL', content: string, status: string = 'Sent') {
    const interactions = await readData<Interaction[]>(INTERACTIONS_FILE, []);
    
    const newInteraction: Interaction = {
        id: crypto.randomUUID(),
        lead_id: leadId,
        interaction_type: type,
        content,
        status,
        created_at: new Date().toISOString()
    };
    
    await writeData(INTERACTIONS_FILE, [newInteraction, ...interactions]);
    
    // Update lead status
    const leads = await getLeadsSafe();
    const lead = leads.find(l => l.id === leadId);
    if (lead && type === 'EMAIL') {
        lead.status = 'CONTACTED';
        await writeData(LEADS_FILE, leads);
    }

    revalidatePath("/memory");
    revalidatePath("/contact");

    return { success: true, interaction: newInteraction };
}

export async function getLeadInteractions(leadId: string) {
    const interactions = await readData<Interaction[]>(INTERACTIONS_FILE, []);
    return interactions.filter(i => i.lead_id === leadId);
}

export async function updateLeadStrategy(leadId: string, strategy: { brandTone: string; keySells: string[]; colorPalette: { name: string; hex: string }[]; creationToolPrompt?: string }) {
  const leads = await getLeadsSafe();
  const lead = leads.find(l => l.id === leadId);
  if (lead) {
      lead.strategy_brief = strategy;
      lead.status = 'STRATEGY_CREATED';
      await writeData(LEADS_FILE, leads);
  }
  
  revalidatePath("/memory");
  revalidatePath("/strategy");
  
  return { success: true };
}

export async function updateLeadStatus(leadId: string, status: Lead['status']) {
  const leads = await getLeadsSafe();
  const lead = leads.find(l => l.id === leadId);
  if (lead) {
      lead.status = status;
      await writeData(LEADS_FILE, leads);
  }
  revalidatePath("/memory");
  return { success: true };
}

export async function deleteLead(leadId: string) {
  const leads = await getLeadsSafe();
  const filtered = leads.filter(l => l.id !== leadId);
  await writeData(LEADS_FILE, filtered);
  
  revalidatePath("/memory");
  revalidatePath("/dashboard");
  
  return { success: true };
}

export async function checkLeadInCRM(name: string, location: string): Promise<boolean> {
  const leads = await getLeadsSafe();
  return leads.some(l => l.company_name === name && l.location === location); 
}

export async function getDashboardStats() {
  const leads = await getLeadsSafe();
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const totalLeads = leads.length;
  const newLeadsLast24h = leads.filter(l => new Date(l.created_at) > oneDayAgo).length;
  const leadGrowth = totalLeads > 0 ? (newLeadsLast24h / totalLeads) * 100 : 0;

  const qualifiedLeads = leads.filter(l => l.rating > 4.5).length;
  const qualifiedGrowth = qualifiedLeads > 0 ? (leads.filter(l => l.rating > 4.5 && new Date(l.created_at) > oneDayAgo).length / qualifiedLeads) * 100 : 0;

  const strategiesCreated = leads.filter(l => l.status === 'STRATEGY_CREATED' || l.status === 'PREVIEW_READY' || l.status === 'CONTACTED' || l.status === 'WON').length;
  const strategyGrowth = strategiesCreated > 0 ? (leads.filter(l => (l.status === 'STRATEGY_CREATED' || l.status === 'PREVIEW_READY' || l.status === 'CONTACTED' || l.status === 'WON') && new Date(l.created_at) > oneDayAgo).length / strategiesCreated) * 100 : 0;

  const contactedLeads = leads.filter(l => l.status === 'CONTACTED' || l.status === 'WON').length;
  const contactedGrowth = contactedLeads > 0 ? (leads.filter(l => (l.status === 'CONTACTED' || l.status === 'WON') && new Date(l.created_at) > oneDayAgo).length / contactedLeads) * 100 : 0;

  return {
    totalLeads: { value: totalLeads, growth: leadGrowth },
    qualifiedLeads: { value: qualifiedLeads, growth: qualifiedGrowth },
    strategiesCreated: { value: strategiesCreated, growth: strategyGrowth },
    contactedLeads: { value: contactedLeads, growth: contactedGrowth }
  };
}

export async function generateSiteConfig(leadId: string) {
  logger.info({ leadId }, "Generating Template Data for Lead");
  const lead = await getLeadById(leadId);
  if (!lead || !lead.strategy_brief) {
    logger.error({ leadId }, "Lead or strategy missing");
    throw new Error("Lead oder Strategie nicht gefunden.");
  }

  // Update status to GENERATING immediately
  const leads = await getLeadsSafe();
  const generatingLeads = leads.map(l => 
    l.id === leadId ? { ...l, status: 'PREVIEW_GENERATING' as const } : l
  );
  await writeData(LEADS_FILE, generatingLeads);
  revalidatePath("/creator");

  const prompt = TEMPLATE_DATA_PROMPT(lead);
  logger.info({ leadId }, "Template Data Prompt prepared");
  
  try {
    const content = await getCompletion(prompt, BOTTIE_SYSTEM_PROMPT);
    console.log("AI Response received for Template Data.");
    
    if (!content || content === '{}') {
      console.error("Empty AI response for template data.");
      throw new Error("KI hat keine gültige Konfiguration geliefert.");
    }

    const previewData = JSON.parse(content);
    
    // Save to database/file
    const leads = await getLeadsSafe();
    const updatedLeads = leads.map(l => 
      l.id === leadId ? { ...l, preview_data: previewData, status: 'PREVIEW_READY' as const } : l
    );
    await writeData(LEADS_FILE, updatedLeads);
    
    console.log("Preview Data saved successfully for lead:", leadId);
    revalidatePath("/creator");
    revalidatePath(`/preview/${leadId}`);
    
    return previewData;
  } catch (err) {
    console.error("Error in generateSiteConfig:", err);
    throw err;
  }
}

export async function generateStrategyAction(leadId: string) {
  const lead = await getLeadById(leadId);
  if (!lead) throw new Error("Lead nicht gefunden.");

  // Update status to STRATEGY_GENERATING
  const leads = await getLeadsSafe();
  const updatedLeads = leads.map(l => 
    l.id === leadId ? { ...l, status: 'STRATEGY_GENERATING' as const } : l
  );
  await writeData(LEADS_FILE, updatedLeads);
  revalidatePath("/strategy");

  // Actually, I need STRATEGY_PROMPT.
  const strategyPrompt = (await import("../prompts")).STRATEGY_PROMPT(lead);
  
  try {
    // Using gpt-4o for complex strategy generation
    const content = await getCompletion(strategyPrompt, "Du bist ein Elite-Webdesign-Stratege.");
    const strategy = JSON.parse(content || '{}');
    
    logger.info({ leadId }, "Strategy generated successfully");
    
    // Save strategy immediately to the lead so it persists in memory
    const finalLeads = await getLeadsSafe();
    const finishedLeads = finalLeads.map(l => 
      l.id === leadId ? { 
        ...l, 
        strategy_brief: strategy,
        status: 'STRATEGY_CREATED' as const 
      } : l
    );
    await writeData(LEADS_FILE, finishedLeads);
    revalidatePath("/strategy");
    revalidatePath("/memory");
    
    return { strategy };
  } catch (err) {
    logger.error({ leadId, error: (err as Error).message }, "Failed to generate strategy");
    const finalLeads = await getLeadsSafe();
    const errorLeads = finalLeads.map(l => 
      l.id === leadId ? { ...l, status: 'DISCOVERED' as const } : l
    );
    await writeData(LEADS_FILE, errorLeads);
    throw err;
  }
}

export interface GlobalAgentStatus {
  discovery: boolean;
  strategy: boolean;
  creator: boolean;
  contact: boolean;
}

export async function getGlobalAgentStatus(): Promise<GlobalAgentStatus> {
  const [leadsResult, missions] = await Promise.all([
    getLeads(),
    getMissions()
  ]);

  const isDiscoveryRunning = missions.some(m => m.status === 'IN_PROGRESS');
  
  // Handle both array and paginated response for backward compatibility
  const leadsArray = Array.isArray(leadsResult) ? leadsResult : leadsResult.leads || [];
  
  const isStrategyRunning = leadsArray.some(l => l.status === 'STRATEGY_GENERATING');
  const isCreatorRunning = leadsArray.some(l => l.status === 'PREVIEW_GENERATING');
  
  // Basic check for contact activity (could be enhanced with a recent activity window)
  const isContactRunning = false; 

  return {
    discovery: isDiscoveryRunning,
    strategy: isStrategyRunning,
    creator: isCreatorRunning,
    contact: isContactRunning
  };
}
