"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Cloud, 
  Monitor, 
  Key, 
  Save, 
  CheckCircle2, 
  Link as LinkIcon,
  ShieldCheck,
  Bot,
  MapPin,
  Search,
  Cpu,
  Globe,
  Database,
  Lock,
  Zap,
  Activity
} from "lucide-react";
import { getSettings, updateSettings, Settings } from "@/lib/settings";
import clsx from "clsx";

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

  if (!settings) return (
    <div className="h-full flex items-center justify-center p-8">
      <Activity className="w-8 h-8 text-primary animate-pulse" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      {/* Header Section */}
      <header className="stagger-item space-y-3">
        <div className="flex items-center space-x-2 text-primary/80 font-medium tracking-widest uppercase text-[10px]">
          <Database className="w-3 h-3" />
          <span>CoreInfrastructure // Control Panel</span>
        </div>
        <h1 className="text-5xl font-serif text-white leading-tight">
          System <span className="text-primary italic">Configuration</span>
        </h1>
        <p className="text-white/40 max-w-xl text-lg font-light leading-relaxed">
          Calibrate your neural engines and endpoint protocols for industrial-grade market intelligence.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Primary Settings */}
        <div className="lg:col-span-12 space-y-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* LLM Provider Section */}
            <section className="stagger-item glass-panel p-8 rounded-[2.5rem] space-y-8 bg-white/1 border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                    <Cpu className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-white/80">Neural Engine</h3>
                    <p className="text-[10px] text-white/30 font-mono italic">Primary Processing Unit</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className={clsx(
                  "p-6 rounded-3xl border transition-all duration-700 flex items-center justify-between",
                  settings.llmProvider === 'cloud' ? "bg-primary/5 border-primary/20" : "bg-white/2 border-white/5 opacity-40 shrink-0"
                )}>
                  <div className="flex items-center gap-5">
                    <Cloud className={clsx("w-8 h-8", settings.llmProvider === 'cloud' ? "text-primary" : "text-white/20")} />
                    <div>
                      <p className="font-bold text-white tracking-tight">Cloud Infrastructure</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">OpenAI / Anthropic Protocol</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.llmProvider === 'cloud'} 
                    onCheckedChange={(checked) => setSettings({...settings, llmProvider: checked ? 'cloud' : 'local'})}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>

                <div className={clsx(
                  "p-6 rounded-3xl border transition-all duration-700 flex items-center justify-between",
                  settings.llmProvider === 'local' ? "bg-accent/5 border-accent/20 shadow-[0_0_30px_rgba(234,179,8,0.05)]" : "bg-white/2 border-white/5 opacity-40 shrink-0"
                )}>
                  <div className="flex items-center gap-5">
                    <Monitor className={clsx("w-8 h-8", settings.llmProvider === 'local' ? "text-accent" : "text-white/20")} />
                    <div>
                      <p className="font-bold text-white tracking-tight">On-Premise Inference</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">LM Studio / Ollama Endpoint</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.llmProvider === 'local'} 
                    onCheckedChange={(checked) => setSettings({...settings, llmProvider: checked ? 'local' : 'cloud'})}
                    className="data-[state=checked]:bg-accent"
                  />
                </div>
              </div>

              {settings.llmProvider === 'local' && (
                <div className="pt-6 border-t border-white/5 space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Local Pipeline Address</Label>
                    <LinkIcon className="w-3 h-3 text-white/20" />
                  </div>
                  <div className="flex gap-4">
                    <Input 
                      value={settings.localEndpoint} 
                      onChange={(e) => setSettings({...settings, localEndpoint: e.target.value})}
                      placeholder="http://localhost:1234/v1"
                      className="h-14 bg-white/5 border-white/5 text-white/80 rounded-2xl focus:ring-accent/40 px-6 font-mono text-xs"
                    />
                    <Button variant="outline" className="h-14 w-20 border-white/10 text-white/40 hover:text-white rounded-2xl">
                      Test
                    </Button>
                  </div>
                </div>
              )}
            </section>

            {/* Discovery Section */}
            <section className="stagger-item glass-panel p-8 rounded-[2.5rem] space-y-8 bg-white/1 border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-accent/10 rounded-2xl border border-accent/20">
                    <Globe className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-white/80">Market Scraper</h3>
                    <p className="text-[10px] text-white/30 font-mono italic">Discovery Engine Logic</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className={clsx(
                  "p-6 rounded-3xl border transition-all duration-700 flex items-center justify-between",
                  settings.discoveryProvider === 'serpapi' ? "bg-green-500/5 border-green-500/20" : "bg-white/2 border-white/5 opacity-40 shrink-0"
                )}>
                  <div className="flex items-center gap-5">
                    <MapPin className={clsx("w-8 h-8", settings.discoveryProvider === 'serpapi' ? "text-green-400" : "text-white/20")} />
                    <div>
                      <p className="font-bold text-white tracking-tight">Direct SERP Link</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">Standard Search Protocol</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.discoveryProvider === 'serpapi'} 
                    onCheckedChange={(checked) => setSettings({...settings, discoveryProvider: checked ? 'serpapi' : 'apify'})}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>

                <div className={clsx(
                  "p-6 rounded-3xl border transition-all duration-700 flex items-center justify-between",
                  settings.discoveryProvider === 'perplexity' ? "bg-purple-500/5 border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.05)]" : "bg-white/2 border-white/5 opacity-40 shrink-0"
                )}>
                  <div className="flex items-center gap-5">
                    <Search className={clsx("w-8 h-8", settings.discoveryProvider === 'perplexity' ? "text-purple-400" : "text-white/20")} />
                    <div>
                      <p className="font-bold text-white tracking-tight">Perplexity AI Search</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">Autonomous Research Agent</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.discoveryProvider === 'perplexity'} 
                    onCheckedChange={(checked) => setSettings({...settings, discoveryProvider: checked ? 'perplexity' : 'serpapi'})}
                    className="data-[state=checked]:bg-purple-500"
                  />
                </div>

                <div className={clsx(
                  "p-6 rounded-3xl border transition-all duration-700 flex items-center justify-between",
                  settings.discoveryProvider === 'brave' ? "bg-orange-500/5 border-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.05)]" : "bg-white/2 border-white/5 opacity-40 shrink-0"
                )}>
                  <div className="flex items-center gap-5">
                    <Globe className={clsx("w-8 h-8", settings.discoveryProvider === 'brave' ? "text-orange-400" : "text-white/20")} />
                    <div>
                      <p className="font-bold text-white tracking-tight">Brave Search API</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">Privacy-First Index</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.discoveryProvider === 'brave'} 
                    onCheckedChange={(checked) => setSettings({...settings, discoveryProvider: checked ? 'brave' : 'serpapi'})}
                    className="data-[state=checked]:bg-orange-500"
                  />
                </div>
              </div>

              {settings.discoveryProvider === 'apify' && !settings.apifyToken && (
                <div className="p-5 bg-primary/10 border border-primary/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-primary text-center">
                  Calibration Required: Apify Token Missing
                </div>
              )}
            </section>
          </div>

          {/* Encryption & Security Section */}
          <section className="stagger-item glass-panel p-10 rounded-[3rem] space-y-10 bg-white/1 border-white/5">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white/5 rounded-3xl border border-white/5">
                <Lock className="w-8 h-8 text-white/60" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-serif text-white italic">Access Keys</h3>
                <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em]">Encrypted Storage Modules</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { label: "OpenAI Protocol", key: "openaiApiKey", icon: Zap, color: "text-blue-400" },
                { label: "SERP Interface", key: "serpApiKey", icon: MapPin, color: "text-green-400" },
                { label: "Resend Gateway", key: "resendApiKey", icon: Cloud, color: "text-orange-400" },
                { label: "Vocal Synthesis", key: "elevenLabsApiKey", icon: Bot, color: "text-purple-400" },
                { label: "Crawler Token", key: "apifyToken", icon: Search, color: "text-cyan-400" },
                { label: "Perplexity AI", key: "perplexityApiKey", icon: Zap, color: "text-purple-400" },
                { label: "Brave Token", key: "braveApiKey", icon: Globe, color: "text-orange-400" },
                { label: "Linear Sync", key: "linearApiKey", icon: ShieldCheck, color: "text-white/60" },
              ].map((item) => (
                <div key={item.key} className="space-y-3 group">
                  <div className="flex items-center justify-between px-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/20 group-hover:text-white/40 transition-colors">
                      {item.label}
                    </Label>
                    <item.icon className={clsx("w-3 h-3 opacity-20 group-hover:opacity-100 transition-all", item.color)} />
                  </div>
                  <div className="relative overflow-hidden rounded-2xl">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                      <Key className="w-4 h-4 text-white/10" />
                    </div>
                    <Input 
                      type="password"
                      value={settings[item.key as keyof Settings] || ''} 
                      onChange={(e) => setSettings({...settings, [item.key]: e.target.value})}
                      className="h-14 bg-white/3 border-white/5 pl-14 pr-6 text-white/60 placeholder:text-white/5 focus:bg-white/5 focus:border-white/10 transition-all text-xs font-mono rounded-2xl"
                      placeholder="••••••••••••••••"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Action Area */}
          <div className="stagger-item flex flex-col md:flex-row items-center justify-between gap-8 pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-px bg-white/5" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10">Architecture Commit v1.4.2</p>
            </div>
            
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className={clsx(
                "h-16 px-12 rounded-3xl text-sm font-black uppercase tracking-[0.2em] transition-all duration-1000 shadow-2xl overflow-hidden group",
                savedSuccess 
                  ? "bg-green-500 text-white shadow-green-500/20" 
                  : "bg-primary hover:bg-primary/80 text-white shadow-primary/20"
              )}
            >
              <div className="relative z-10 flex items-center">
                {isSaving ? (
                  <Activity className="w-5 h-5 mr-3 animate-spin" />
                ) : savedSuccess ? (
                  <CheckCircle2 className="w-5 h-5 mr-3" />
                ) : (
                  <Save className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" />
                )}
                {isSaving ? "Calibrating..." : savedSuccess ? "System Synced" : "Write Configuration"}
              </div>
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
