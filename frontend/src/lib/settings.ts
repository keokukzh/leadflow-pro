"use server";

import { revalidatePath } from "next/cache";
import { readData, writeData } from "./storage";

export type DiscoveryProvider = 'serpapi' | 'apify' | 'perplexity' | 'brave';

export interface Settings {
  llmProvider: 'cloud' | 'local';
  localEndpoint: string;
  serpApiKey: string;
  openaiApiKey: string;
  elevenLabsApiKey: string;
  resendApiKey: string;
  apifyToken: string;
  linearApiKey: string;
  discoveryProvider: DiscoveryProvider;
  perplexityApiKey: string;
  braveApiKey?: string;
  googleMapsApiKey?: string;
}

const SETTINGS_FILE = 'settings.json';

const DEFAULT_SETTINGS: Settings = {
  llmProvider: 'cloud',
  localEndpoint: 'http://localhost:1234/v1',
  serpApiKey: '',
  openaiApiKey: '',
  elevenLabsApiKey: '',
  resendApiKey: '',
  apifyToken: '',
  linearApiKey: '',
  discoveryProvider: 'serpapi',
  perplexityApiKey: '',
  braveApiKey: '',
  googleMapsApiKey: '',
};

const isPlaceholder = (val: string) => !val || val.includes("PLACEHOLDER") || val.includes("YOUR_API_KEY");

export async function getSettings(): Promise<Settings> {
  const settings = await readData<Settings>(SETTINGS_FILE, DEFAULT_SETTINGS);
  
  const rawSettings = {
    ...settings,
    serpApiKey: settings.serpApiKey || process.env.SERPAPI_API_KEY || '',
    openaiApiKey: settings.openaiApiKey || process.env.OPENAI_API_KEY || '',
    elevenLabsApiKey: settings.elevenLabsApiKey || process.env.ELEVENLABS_API_KEY || '',
    resendApiKey: settings.resendApiKey || process.env.RESEND_API_KEY || '',
    apifyToken: settings.apifyToken || process.env.APIFY_TOKEN || '',
    linearApiKey: settings.linearApiKey || process.env.LINEAR_API_KEY || '',
    perplexityApiKey: settings.perplexityApiKey || process.env.PERPLEXITY_API_KEY || '',
    braveApiKey: settings.braveApiKey || process.env.BRAVE_API_KEY || '',
  };

  return {
    ...rawSettings,
    serpApiKey: isPlaceholder(rawSettings.serpApiKey) ? '' : rawSettings.serpApiKey,
    openaiApiKey: isPlaceholder(rawSettings.openaiApiKey) ? '' : rawSettings.openaiApiKey,
    elevenLabsApiKey: isPlaceholder(rawSettings.elevenLabsApiKey) ? '' : rawSettings.elevenLabsApiKey,
    resendApiKey: isPlaceholder(rawSettings.resendApiKey) ? '' : rawSettings.resendApiKey,
    apifyToken: isPlaceholder(rawSettings.apifyToken) ? '' : rawSettings.apifyToken,
    linearApiKey: isPlaceholder(rawSettings.linearApiKey) ? '' : rawSettings.linearApiKey,
    perplexityApiKey: isPlaceholder(rawSettings.perplexityApiKey) ? '' : rawSettings.perplexityApiKey,
    braveApiKey: isPlaceholder(rawSettings.braveApiKey) ? '' : rawSettings.braveApiKey,
  };
}

export async function updateSettings(newSettings: Partial<Settings>) {
  const currentSettings = await readData<Settings>(SETTINGS_FILE, DEFAULT_SETTINGS);
  const updated = { ...currentSettings, ...newSettings };
  await writeData(SETTINGS_FILE, updated);
  
  revalidatePath("/settings");
  return { success: true };
}
