import { NextResponse } from 'next/server';
import { getCompletion } from '@/lib/ai-client';
import { STRATEGY_PROMPT } from '@/lib/prompts';

export async function POST(req: Request) {
  try {
    const { lead } = await req.json();
    const prompt = STRATEGY_PROMPT(lead);

    const content = await getCompletion(
        prompt, 
        "Du bist ein erfahrener Webdesign-Stratege und Marken-Experte."
    );
    
    console.log("Strategy AI Raw Content:", content);

    if (!content || content === '{}') {
      throw new Error("KI hat leere oder ungültige Strategie zurückgegeben");
    }
    
    try {
      const strategy = JSON.parse(content);
      return NextResponse.json({ strategy });
    } catch (parseError) {
      console.error("JSON Parse Error in Strategy Route:", parseError);
      throw new Error("KI-Antwort konnte nicht verarbeitet werden");
    }

  } catch (error: any) {
    console.error("Total Strategy Generation Error:", error);
    return NextResponse.json({ error: error.message || "Generation failed" }, { status: 500 });
  }
}
