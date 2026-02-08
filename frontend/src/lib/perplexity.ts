import { getSettings } from "./settings";

export interface PerplexityLead {
  place_id: string;
  name: string;
  vicinity: string;
  website: string | null;
  source_url?: string;
  industry: string;
  rating?: number;
  user_ratings_total?: number;
  analysis: {
    priorityScore: number;
    mainSentiment: string;
    painPoints: string[];
    targetDecisionMaker: string;
    valueProposition: string;
    outreachStrategy: string;
    conversationStarters: string[];
  };
}

export async function searchLeadsWithPerplexity(industry: string, location: string): Promise<PerplexityLead[]> {
  const settings = await getSettings();
  if (!settings.perplexityApiKey) {
    throw new Error("Perplexity API Key fehlt in den Einstellungen.");
  }

  const prompt = `Finde 5 hochwertige Leads (B2B Unternehmen) in der Branche "${industry}" in "${location}". 
Die Unternehmen sollten eine schlechte oder gar keine Website haben, aber gute Google-Bewertungen.

WICHTIG: Erfinde KEINE Namen. Nutze nur ECHTE Unternehmen, die du online finden kannst.
Keine generischen Namen wie "Bäckerei ${location}" wenn es diesen Laden nicht exakt so gibt.

Gib die Ergebnisse als JSON-Array zurück. Jedes Objekt im Array muss folgendes Schema haben:
{
  "name": "Name des Unternehmens",
  "vicinity": "Adresse oder Standort",
  "website": "URL oder null",
  "source_url": "Link zu Google Maps oder Verzeichniseintrag (falls vorhanden)",
  "industry": "${industry}",
  "rating": 4.5,
  "user_ratings_total": 20,
  "analysis": {
    "priorityScore": 1-10,
    "mainSentiment": "Sentiment der Bewertungen",
    "painPoints": ["Schmerzpunkt 1", "Schmerzpunkt 2"],
    "targetDecisionMaker": "Ansprechpartner Funktion",
    "valueProposition": "Nutzenversprechen",
    "outreachStrategy": "Strategie",
    "conversationStarters": ["Einstiegssatz"]
  }
}

WICHTIG: Antworte NUR mit dem validen JSON-Array.`;

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${settings.perplexityApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar-reasoning-pro",
      messages: [
        { role: "system", content: "Du bist ein spezialisierter B2B Business Research Bot. Gib nur valides JSON zurück." },
        { role: "user", content: prompt }
      ]
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Perplexity API Fehler: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    const jsonStr = extractJsonFromText(content);
    const results = JSON.parse(jsonStr);
    const finalLeads = Array.isArray(results) ? results : (results.leads || results.results || []);
    
    // Ensure each lead has a place_id and industry
    return finalLeads.map((l: { name: string; vicinity: string; industry?: string; rating?: number; user_ratings_total?: number; analysis: any }) => ({
      ...l,
      place_id: `pplx-${l.name.replace(/\s+/g, '-').toLowerCase()}-${l.vicinity.split(',')[0].trim().toLowerCase()}`,
      industry: l.industry || industry
    })) as PerplexityLead[];
  } catch (e) {
    console.error("Fehler beim Parsen der Perplexity-Antwort:", e);
    console.log("Raw content was:", content);
    return [];
  }
}

function extractJsonFromText(text: string): string {
  if (!text) return "[]";
  
  // Try to find JSON block if it exists
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const content = jsonMatch ? jsonMatch[1].trim() : text.trim();
  
  // Find first '[' and last ']' or first '{' and last '}'
  const firstBracket = content.indexOf('[');
  const lastBracket = content.lastIndexOf(']');
  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');
  
  if (firstBracket !== -1 && lastBracket !== -1 && (firstBracket < firstBrace || firstBrace === -1)) {
    return content.substring(firstBracket, lastBracket + 1);
  } else if (firstBrace !== -1 && lastBrace !== -1) {
    return content.substring(firstBrace, lastBrace + 1);
  }
  
  return content;
}
