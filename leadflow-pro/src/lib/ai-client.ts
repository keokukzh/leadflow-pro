import OpenAI from "openai";
import { getSettings } from "./settings";

export async function getCompletion(prompt: string, systemPrompt: string = "You are a helpful assistant.") {
  const settings = await getSettings();

  if (settings.llmProvider === 'cloud') {
    if (!settings.openaiApiKey) {
      throw new Error("OpenAI API Key fehlt in den Einstellungen.");
    }
    
    const isOpenRouter = settings.openaiApiKey.startsWith('sk-or-');
    
    const openai = new OpenAI({
      apiKey: settings.openaiApiKey,
      baseURL: isOpenRouter ? "https://openrouter.ai/api/v1" : undefined,
      defaultHeaders: isOpenRouter ? {
        "HTTP-Referer": "https://leadflow-pro.local", // Optional, for OpenRouter ranking
        "X-Title": "LeadFlow Pro",
      } : undefined,
    });

    const response = await openai.chat.completions.create({
      model: isOpenRouter ? "openai/gpt-4o" : "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || "";
    return extractJson(content);
  } else {
    // Local LM Studio / OpenAI-compatible endpoint
    const response = await fetch(`${settings.localEndpoint}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: -1,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`LM Studio Fehler: ${response.statusText}`);
    }

    const data = await response.json();
    const rawContent = data.choices[0].message.content || "";
    return extractJson(rawContent);
  }
}

function extractJson(text: string): string {
  if (!text) return "{}";
  
  // Try to find JSON block if it exists
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const content = jsonMatch ? jsonMatch[1] : text;
  
  try {
    // Validate if it's parsable
    JSON.parse(content.trim());
    return content.trim();
  } catch {
    // If not parsable, try to find the first '{' and last '}'
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      const extracted = text.substring(firstBrace, lastBrace + 1);
      try {
        JSON.parse(extracted);
        return extracted;
      } catch {
        return "{}";
      }
    }
    return "{}";
  }
}
