import { NextResponse } from 'next/server';
import { getCompletion } from '@/lib/ai-client';
import { getSettings } from '@/lib/settings';
import { logInteraction } from '@/lib/actions/server-actions';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { lead, strategy } = await req.json();
    const settings = await getSettings();
    const apiKey = settings.elevenLabsApiKey;

    const prompt = `
      Erstelle ein kurzes, überzeugendes Akquise-Telefonskript (max. 45 Sekunden Redezeit).
      Firma: ${lead.company_name}
      Branche: ${lead.industry}
      Problem: Hat keine Website, aber gute Google-Bewertungen (${lead.rating} Sterne).
      Lösung: Wir haben bereits einen fertigen Website-Entwurf erstellt.
      Strategie-Details: ${strategy.brandTone}
      
      Schreibe das Skript im "Du" oder "Sie" Stil (wähle basierend auf Branche - Handwerk eher Du, Tech eher Sie).
      Antworte NUR mit dem Skript-Text.
    `;

    const script = await getCompletion(
        prompt, 
        "Du bist ein charismatischer Sales-Experte am Telefon."
    );

    if (!apiKey || !script) {
        return NextResponse.json({ 
            script,
            audioUrl: null,
            warning: "ElevenLabs API Key fehlt. Nur Skript generiert."
        });
    }

    // ElevenLabs TTS Integration
    const VOICE_ID = "pNInz6obpgnuMGrWqeX1"; // Josh
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: script,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        }
      }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("ElevenLabs Error:", errorData);
        return NextResponse.json({ script, audioUrl: null, error: "ElevenLabs API Fehler" });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `voice-${lead.id}.mp3`;
    const filePath = path.join(process.cwd(), 'public', 'audio', fileName);

    fs.writeFileSync(filePath, buffer);

    // Log the interaction
    await logInteraction(lead.id, 'CALL', 'KI-Voice Pitch generiert', 'Generated');

    return NextResponse.json({ 
        script,
        audioUrl: `/audio/${fileName}`
    });

  } catch (error) {
    console.error("Voice API Error:", error);
    return NextResponse.json({ error: "Failed to generate voice script" }, { status: 500 });
  }
}
