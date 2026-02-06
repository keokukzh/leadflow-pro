import { getSettings } from "./settings";

export interface PerplexityLead {
  name: string;
  vicinity: string;
  website: string | null;
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

Gib die Ergebnisse als JSON-Array zurück. Jedes Objekt im Array muss folgendes Schema haben:
{
  "name": "Name des Unternehmens",
  "vicinity": "Adresse oder Standort",
  "website": "URL oder null",
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
      ],
      response_format: { type: "json_object" }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Perplexity API Fehler: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    const results = JSON.parse(content);
    return Array.isArray(results) ? results : (results.leads || []);
  } catch (e) {
    console.error("Fehler beim Parsen der Perplexity-Antwort:", e);
    return [];
  }
}
