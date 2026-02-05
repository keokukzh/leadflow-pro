"use client";

import { useState, useEffect } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Mail, 
  Phone, 
  Send, 
  Mic2, 
  Search, 
  History, 
  CheckCircle2, 
  Loader2, 
  Play, 
  Copy, 
  Sparkles,
  ExternalLink
} from "lucide-react";
import { getLeads, logInteraction, getLeadInteractions, Lead, Interaction } from "@/lib/actions/server-actions";
import { format } from "date-fns";

export default function ContactPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  
  // Email State
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  
  // Voice State
  const [voiceScript, setVoiceScript] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  useEffect(() => {
    const fetchLeads = async () => {
      const allLeads = await getLeads();
      setLeads(allLeads.filter(l => l.strategy_brief));
    };
    fetchLeads();
  }, []);

  useEffect(() => {
    if (selectedLeadId) {
      const fetchInteractions = async () => {
        const data = await getLeadInteractions(selectedLeadId);
        setInteractions(data);
      };
      fetchInteractions();
      
      // Auto-fill templates when lead changes
      if (selectedLead) {
        setEmailSubject(`Neuer Website-Entwurf für ${selectedLead.company_name}`);
        setEmailBody(`
          Hallo ${selectedLead.company_name} Team,
          
          ich habe mir Ihre Präsenz in ${selectedLead.location} angesehen. 
          Ihre Kunden sind mit den Bewertungen (${selectedLead.rating} Sterne) bereits sehr zufrieden. 
          
          Damit Sie auch online optimal gefunden werden, habe ich einen exklusiven Website-Entwurf für Sie erstellt:
          ${window.location.origin}/preview/${selectedLead.id}
          
          Ich würde mich freuen, Ihnen dieses Konzept kurz vorzustellen.
          
          Beste Grüße,
          Ihr LeadFlow Pro Team
        `.trim());
      }
    }
  }, [selectedLeadId, selectedLead]);

  const handleSendEmail = async () => {
    if (!selectedLead) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/contact/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead: selectedLead, subject: emailSubject, body: emailBody })
      });
      
      if (res.ok) {
        const updated = await getLeadInteractions(selectedLeadId);
        setInteractions(updated);
        // Toast or success message could go here
      }
    } catch (error) {
      console.error("Email failed:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateVoice = async () => {
    if (!selectedLead) return;
    setIsGeneratingVoice(true);
    try {
      const res = await fetch("/api/contact/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead: selectedLead, strategy: selectedLead.strategy_brief })
      });
      const data = await res.json();
      setVoiceScript(data.script);
      setAudioUrl(data.audioUrl);
      
      const updated = await getLeadInteractions(selectedLeadId);
      setInteractions(updated);
    } catch (error) {
      console.error("Voice failed:", error);
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-white">Contact Agent</h2>
          <p className="text-slate-400">Automatisiere Outreach via Email und KI-Sprachmitteilungen.</p>
        </div>

        <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 w-full md:max-w-md">
          <Select onValueChange={setSelectedLeadId} value={selectedLeadId}>
            <SelectTrigger className="bg-slate-950 border-slate-800">
              <SelectValue placeholder="Wähle einen Lead aus..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
              {leads.map((lead) => (
                <SelectItem key={lead.id} value={lead.id}>
                  {lead.company_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedLeadId ? (
          <Card className="bg-slate-900/50 border-slate-800 border-dashed py-32 text-center">
            <Search className="w-16 h-16 mx-auto mb-4 text-slate-800" />
            <p className="text-slate-500 font-medium">Wähle einen Lead oben aus, um Kontaktaufnahme zu starten.</p>
          </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <Tabs defaultValue="email" className="w-full">
                    <TabsList className="bg-slate-900 border border-slate-800 p-1 mb-6">
                        <TabsTrigger value="email" className="data-[state=active]:bg-blue-600">
                            <Mail className="w-4 h-4 mr-2" />
                            E-Mail Outreach
                        </TabsTrigger>
                        <TabsTrigger value="voice" className="data-[state=active]:bg-purple-600">
                            <Phone className="w-4 h-4 mr-2" />
                            Voice Pitch
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="email">
                        <Card className="bg-slate-900 border-slate-800">
                            <CardContent className="pt-6 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Betreff</label>
                                    <Input 
                                        value={emailSubject} 
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailSubject(e.target.value)}
                                        className="bg-slate-950 border-slate-800"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nachricht</label>
                                    <Textarea 
                                        value={emailBody} 
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEmailBody(e.target.value)}
                                        className="bg-slate-950 border-slate-800 min-h-[300px] leading-relaxed"
                                    />
                                </div>
                                    <div className="flex justify-between items-center p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <ExternalLink className="w-4 h-4 text-blue-400" />
                                            <span className="text-xs text-blue-300 font-mono">/preview/{selectedLead?.id}</span>
                                        </div>
                                        <Button 
                                            onClick={handleSendEmail} 
                                            disabled={isSending}
                                            className="bg-blue-600 hover:bg-blue-500 font-bold px-8"
                                        >
                                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Senden</>}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="voice">
                        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
                            <div className="bg-linear-to-r from-purple-600/10 to-blue-600/10 p-6 border-b border-white/5">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-purple-400" />
                                            AI Voice Pitch
                                        </h3>
                                        <p className="text-xs text-slate-400">Automatisch generiertes Skript für ElevenLabs.</p>
                                    </div>
                                    <Button 
                                        onClick={handleGenerateVoice} 
                                        disabled={isGeneratingVoice}
                                        className="bg-purple-600 hover:bg-purple-500 font-bold"
                                    >
                                        {isGeneratingVoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Mic2 className="w-4 h-4 mr-2" /> Generieren</>}
                                    </Button>
                                </div>
                            </div>
                            <CardContent className="p-6">
                                {voiceScript ? (
                                    <div className="space-y-6">
                                        <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl relative">
                                            <p className="text-lg leading-relaxed text-slate-300 italic">
                                                &quot;{voiceScript}&quot;
                                            </p>
                                            <div className="absolute top-2 right-2">
                                                <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(voiceScript)}>
                                                    <Copy className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                            <Button 
                                                size="icon" 
                                                disabled={!audioUrl}
                                                onClick={() => {
                                                    const audio = document.getElementById('voice-audio') as HTMLAudioElement;
                                                    if (audio.paused) audio.play();
                                                    else audio.pause();
                                                }}
                                                className="rounded-full bg-purple-600 w-12 h-12 hover:bg-purple-500 transition-colors"
                                            >
                                                <Play className="w-6 h-6 fill-white" />
                                            </Button>
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm font-bold">Voice Synthesis {audioUrl ? '(Bereit)' : '(Verarbeitung...)'}</p>
                                                {audioUrl && (
                                                    <audio id="voice-audio" src={audioUrl} />
                                                )}
                                                <div className="h-1.5 bg-slate-700 rounded-full w-full overflow-hidden">
                                                    <div className={`h-full bg-purple-500 ${audioUrl ? 'w-full' : 'w-1/3 animate-pulse'}`} />
                                                </div>
                                            </div>
                                            <span className="text-xs font-mono text-slate-500">0:45</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-20 text-center space-y-4 opacity-30 italic">
                                        <Mic2 className="w-12 h-12 mx-auto" />
                                        <p>Noch kein Skript generiert.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            <div className="space-y-6">
                <Card className="bg-slate-900 border-slate-800 h-full flex flex-col">
                    <CardHeader className="border-b border-slate-800">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <History className="w-4 h-4 text-slate-400" />
                            Interaktions-Log
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 overflow-hidden flex-1">
                        <div className="divide-y divide-slate-800 overflow-y-auto h-[500px]">
                            {interactions.length > 0 ? interactions.map((item) => (
                                <div key={item.id} className="p-4 space-y-2 hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${item.interaction_type === 'EMAIL' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                            {item.interaction_type}
                                        </div>
                                        <span className="text-[10px] text-slate-500">{format(new Date(item.created_at), "HH:mm, dd. MMM")}</span>
                                    </div>
                                    <p className="text-sm text-slate-300 line-clamp-2">{item.content}</p>
                                    <div className="flex items-center gap-1 text-[10px] text-green-500/80 font-bold">
                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                        {item.status}
                                    </div>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-xs text-slate-600 italic">Noch keine Aktivitäten.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      )}
    </div>
  );
}
