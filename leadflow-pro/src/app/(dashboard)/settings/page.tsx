"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Settings as SettingsIcon, 
  Cloud, 
  Monitor, 
  Key, 
  Save, 
  CheckCircle2, 
  Link as LinkIcon,
  ShieldCheck,
  Bot,
  MapPin,
  Search
} from "lucide-react";
import { getSettings, updateSettings, Settings } from "@/lib/settings";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await getSettings();
      setSettings(data);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    await updateSettings(settings);
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  if (!settings) return <div className="p-8">Lade Einstellungen...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-blue-500" />
          Einstellungen
        </h2>
        <p className="text-slate-400">Konfiguriere deine AI-Provider und API-Schlüssel.</p>
      </div>

      <div className="grid gap-6">
        {/* LLM Provider Card */}
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <CardHeader className="border-b border-slate-800 bg-slate-900/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-purple-400" />
              LLM Provider
            </CardTitle>
            <CardDescription>Wähle zwischen Cloud-Inferenz oder lokalem Modell.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${settings.llmProvider === 'cloud' ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold">Cloud (OpenAI / Claude)</p>
                  <p className="text-xs text-slate-500">Schnell, zuverlässig, erfordert API-Key.</p>
                </div>
              </div>
              <Switch 
                checked={settings.llmProvider === 'local'} 
                onCheckedChange={(checked) => setSettings({...settings, llmProvider: checked ? 'local' : 'cloud'})}
              />
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${settings.llmProvider === 'local' ? 'bg-purple-600/20 text-purple-400' : 'bg-slate-800 text-slate-500'}`}>
                  <Monitor className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <p className="font-bold">Local (LM Studio)</p>
                  <p className="text-xs text-slate-500">Privat, kostenlos, erfordert aktive App.</p>
                </div>
              </div>
            </div>

            {settings.llmProvider === 'local' && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Local Endpoint URL</Label>
                <div className="flex gap-2">
                  <Input 
                    value={settings.localEndpoint} 
                    onChange={(e) => setSettings({...settings, localEndpoint: e.target.value})}
                    placeholder="http://localhost:1234/v1"
                    className="bg-slate-950 border-slate-800"
                  />
                  <Button variant="outline" className="border-slate-800 gap-2 shrink-0">
                    <LinkIcon className="w-4 h-4" />
                    Test
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Keys Card */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="border-b border-slate-800 bg-slate-900/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-400" />
              API Schlüssel
            </CardTitle>
            <CardDescription>Diese Schlüssel werden lokal für deine Requests verwendet.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">OpenAI API Key</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                  <Input 
                    type="password"
                    value={settings.openaiApiKey} 
                    onChange={(e) => setSettings({...settings, openaiApiKey: e.target.value})}
                    className="bg-slate-950 border-slate-800 pl-10"
                    placeholder="sk-..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">SerpApi (Google Maps)</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                  <Input 
                    type="password"
                    value={settings.serpApiKey} 
                    onChange={(e) => setSettings({...settings, serpApiKey: e.target.value})}
                    className="bg-slate-950 border-slate-800 pl-10"
                    placeholder="Key für Maps-Suche..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Resend (E-Mail)</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                  <Input 
                    type="password"
                    value={settings.resendApiKey} 
                    onChange={(e) => setSettings({...settings, resendApiKey: e.target.value})}
                    className="bg-slate-950 border-slate-800 pl-10"
                    placeholder="re_..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">ElevenLabs (Voice)</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                  <Input 
                    type="password"
                    value={settings.elevenLabsApiKey} 
                    onChange={(e) => setSettings({...settings, elevenLabsApiKey: e.target.value})}
                    className="bg-slate-950 border-slate-800 pl-10"
                    placeholder="Voice-Key..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Apify Token</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                  <Input 
                    type="password"
                    value={settings.apifyToken} 
                    onChange={(e) => setSettings({...settings, apifyToken: e.target.value})}
                    className="bg-slate-950 border-slate-800 pl-10"
                    placeholder="apify_api_..."
                  />
                </div>
                <p className="text-xs text-slate-500">Get your token at <a href="https://console.apify.com/account#/integrations" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">console.apify.com</a></p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Discovery Provider Card */}
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <CardHeader className="border-b border-slate-800 bg-slate-900/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="w-5 h-5 text-cyan-400" />
              Discovery Provider
            </CardTitle>
            <CardDescription>Wähle den Provider für die Lead-Suche auf Google Maps.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${settings.discoveryProvider === 'serpapi' ? 'bg-green-600/20 text-green-400' : 'bg-slate-800 text-slate-500'}`}>
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold">SerpAPI</p>
                  <p className="text-xs text-slate-500">Standard Google Maps API.</p>
                </div>
              </div>
              <Switch 
                checked={settings.discoveryProvider === 'apify'} 
                onCheckedChange={(checked) => setSettings({...settings, discoveryProvider: checked ? 'apify' : 'serpapi'})}
              />
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${settings.discoveryProvider === 'apify' ? 'bg-cyan-600/20 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
                  <Bot className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <p className="font-bold">Apify</p>
                  <p className="text-xs text-slate-500">Erweiterte Scraping-Funktionen.</p>
                </div>
              </div>
            </div>
            
            {settings.discoveryProvider === 'apify' && !settings.apifyToken && (
              <div className="p-3 bg-amber-900/20 border border-amber-800/50 rounded-lg text-amber-400 text-sm">
                ⚠️ Apify Token nicht konfiguriert. Bitte füge deinen Token oben hinzu.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className={`min-w-[200px] h-12 text-md font-bold transition-all ${savedSuccess ? 'bg-green-600 hover:bg-green-600' : 'bg-blue-600 hover:bg-blue-500'}`}
          >
            {isSaving ? "Speichere..." : savedSuccess ? (
              <><CheckCircle2 className="w-5 h-5 mr-2" /> Gespeichert!</>
            ) : (
              <><Save className="w-5 h-5 mr-2" /> Einstellungen speichern</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Dummy icon for brain circuit as it wasn't imported
function BrainCircuit({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0 .94 4.82 2.5 2.5 0 0 0 0 4.28 2.5 2.5 0 0 0-1 4.83 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 0-4.83 2.5 2.5 0 0 0-1-4.28 2.5 2.5 0 0 0 .94-4.82z"/>
      <path d="M12 4.5V7"/>
      <path d="M12 17v2.5"/>
      <path d="m14 11.5 2.5 1.5"/>
      <path d="M12 7c1.4 0 2.5 1.1 2.5 2.5 0 .2 0 .5-.1.7l1.1 1.1"/>
      <path d="m14 19-1.5-2.5"/>
    </svg>
  );
}
