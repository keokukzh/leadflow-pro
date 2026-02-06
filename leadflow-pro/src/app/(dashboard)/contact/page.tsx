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
import { Card, CardContent } from "@/components/ui/card";
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
  ExternalLink,
  Terminal,
  Activity,
  Zap,
  Monitor
} from "lucide-react";
import { getLeads, getLeadInteractions, Lead, Interaction } from "@/lib/actions/server-actions";
import { format } from "date-fns";
import clsx from "clsx";

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
    if (selectedLeadId && selectedLead) {
      const fetchInteractions = async () => {
        const data = await getLeadInteractions(selectedLeadId);
        setInteractions(data);
      };
      fetchInteractions();
      
      setEmailSubject(`Strategic Proposal for ${selectedLead.company_name} // Alpha Logic`);
      setEmailBody(`
Hello ${selectedLead.company_name} Team,

I've been analyzing your market position in ${selectedLead.location}. 
Your current customer satisfaction rating of ${selectedLead.rating} indicates a strong foundation.

To further amplify your digital footprint, I've forged a high-precision website architecture specifically for your sector:
${window.location.origin}/preview/${selectedLead.id}

Our neural analysis suggests this structural pivot will optimize target acquisition by 40%.

Transmission Protocol 1.0.4.
LeadFlow Pro // Intelligence Unit
      `.trim());
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
    <div className="space-y-12 max-w-[1400px] mx-auto px-4 pb-20">
      {/* Header telemetry */}
      <header className="stagger-item space-y-3 pt-4">
        <div className="flex items-center space-x-2 text-primary/80 font-medium tracking-widest uppercase text-[10px]">
          <Activity className="w-3 h-3" />
          <span>MissionControl // Outreach Module</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-2">
            <h1 className="text-5xl font-serif text-white leading-tight">
              Command <span className="text-primary italic">Center</span>
            </h1>
            <p className="text-white/40 max-w-xl text-lg font-light leading-relaxed">
              Execute high-precision transmission protocols for Swiss market nodes.
            </p>
          </div>

          <div className="bg-white/1 p-1 rounded-[2.5rem] border border-white/5 w-full md:max-w-md backdrop-blur-3xl shadow-2xl">
            <div className="bg-white/1 p-3 rounded-[2.2rem] border border-white/5">
              <Select onValueChange={setSelectedLeadId} value={selectedLeadId}>
                <SelectTrigger className="bg-transparent border-none focus:ring-0 text-white font-mono text-xs font-black uppercase tracking-widest h-12 px-6 hover:bg-white/5 transition-colors rounded-[1.8rem]">
                  <div className="flex items-center gap-3">
                    <Terminal className="w-4 h-4 text-primary" />
                    <SelectValue placeholder="SELECT TARGET NODE..." />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-[#0A0A0B] border-white/5 text-white/60 font-mono text-[10px] uppercase tracking-widest rounded-3xl">
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id} className="focus:bg-primary/10 focus:text-primary transition-colors py-3 hover:bg-white/5 cursor-pointer">
                      {lead.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      {!selectedLeadId ? (
          <div className="stagger-item glass-panel bg-white/1 border-white/5 border-dashed py-48 text-center rounded-[4rem]" style={{ animationDelay: '200ms' }}>
            <div className="relative inline-block mb-10">
              <Search className="w-24 h-24 mx-auto text-white/5" />
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            </div>
            <p className="text-white/20 font-black uppercase tracking-[1em] text-[10px]">Awaiting Node Selection</p>
          </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 stagger-item" style={{ animationDelay: '200ms' }}>
            {/* Left Telemetry Pane */}
            <div className="lg:col-span-4 space-y-8">
                {/* Node Stats */}
                <Card className="glass-panel bg-white/1 border-white/5 rounded-[3rem] p-8 space-y-8 overflow-hidden relative">
                   <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/10 blur-3xl rounded-full" />
                   <div className="space-y-6 relative z-10">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
                            <Monitor className="w-4 h-4 text-primary" />
                         </div>
                         <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 font-mono">Node Telemetry</h3>
                      </div>
                      
                      <div className="space-y-6">
                         <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Entity // Label</span>
                            <span className="text-2xl font-serif text-white">{selectedLead?.company_name}</span>
                         </div>
                         <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                            <div className="flex flex-col gap-1">
                               <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Index</span>
                               <span className="text-xs font-mono text-white/60">{selectedLead?.rating} SF</span>
                            </div>
                            <div className="flex flex-col gap-1">
                               <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Status</span>
                               <span className="text-xs font-mono text-accent">{selectedLead?.status}</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </Card>

                {/* Interaction Log */}
                <Card className="glass-panel bg-white/1 border-white/5 rounded-[3rem] flex flex-col h-[600px]">
                    <div className="p-8 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <History className="w-4 h-4 text-white/20" />
                           <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 font-mono">Protocol Log</h3>
                        </div>
                        <span className="font-mono text-[9px] text-white/10">{interactions.length} Entries</span>
                    </div>
                    <CardContent className="p-0 overflow-hidden flex-1">
                        <div className="divide-y divide-white/5 overflow-y-auto h-full custom-scrollbar">
                            {interactions.length > 0 ? interactions.map((item) => (
                                <div key={item.id} className="p-6 space-y-4 hover:bg-white/2 transition-all duration-700 group">
                                    <div className="flex items-center justify-between">
                                        <div className={clsx(
                                          "px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase border",
                                          item.interaction_type === 'EMAIL' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                        )}>
                                            {item.interaction_type}
                                        </div>
                                        <span className="text-[9px] text-white/10 font-mono font-bold">{format(new Date(item.created_at), "HH:mm, MMM d")}</span>
                                    </div>
                                    <p className="text-xs text-white/40 leading-relaxed font-light group-hover:text-white/60 transition-colors line-clamp-3 italic">
                                      &quot;{item.content}&quot;
                                    </p>
                                    <div className="flex items-center gap-1.5 text-[9px] text-green-500/40 font-black uppercase tracking-widest">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Commit // {item.status}
                                    </div>
                                </div>
                            )) : (
                                <div className="p-20 text-center space-y-4 text-white/5 italic">
                                   <Zap className="w-10 h-10 mx-auto" />
                                   <p className="text-[10px] font-black uppercase tracking-widest">Lattice Empty</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Command Modules */}
            <div className="lg:col-span-8 space-y-8">
                <Tabs defaultValue="email" className="w-full">
                    <TabsList className="bg-white/1 border border-white/5 p-2 mb-10 rounded-[2.5rem] h-20 w-fit">
                        <TabsTrigger value="email" className="data-[state=active]:bg-white/5 data-[state=active]:text-primary rounded-[1.8rem] px-10 font-mono text-xs font-black uppercase tracking-widest transition-all">
                            <Mail className="w-4 h-4 mr-3" />
                            Transmission Alpha
                        </TabsTrigger>
                        <TabsTrigger value="voice" className="data-[state=active]:bg-white/5 data-[state=active]:text-accent rounded-[1.8rem] px-10 font-mono text-xs font-black uppercase tracking-widest transition-all">
                            <Phone className="w-4 h-4 mr-3" />
                            Audio Protocol
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="email" className="mt-0 focus-visible:outline-none">
                        <Card className="glass-panel bg-white/1 border-white/5 rounded-[4rem] p-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-3xl -mr-48 -mt-48 rounded-full" />
                            <CardContent className="p-0 space-y-10 relative z-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 font-mono ml-4">Transmission // Subject</label>
                                    <Input 
                                        value={emailSubject} 
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailSubject(e.target.value)}
                                        className="bg-white/1 border-white/5 h-16 px-8 rounded-4xl font-serif text-lg text-white focus:border-primary/40 transition-all"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 font-mono ml-4">Payload Content</label>
                                    <Textarea 
                                        value={emailBody} 
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEmailBody(e.target.value)}
                                        className="bg-white/1 border-white/5 min-h-[400px] p-10 rounded-[3rem] font-light text-xl leading-relaxed text-white/60 focus:border-primary/40 transition-all custom-scrollbar outline-none ring-0 focus:ring-0"
                                    />
                                </div>
                                
                                <div className="flex flex-col md:flex-row justify-between items-center gap-8 p-10 bg-white/2 border border-white/5 rounded-[3rem] backdrop-blur-3xl">
                                    <div className="flex items-center gap-6">
                                        <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
                                           <ExternalLink className="w-6 h-6 text-primary" />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                           <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Preview // Lattice Node</span>
                                           <span className="text-sm font-mono text-primary/60 hover:text-primary transition-colors cursor-pointer">/preview/{selectedLead?.id}</span>
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={handleSendEmail} 
                                        disabled={isSending}
                                        className="bg-primary hover:bg-primary/80 h-16 px-12 rounded-[2rem] text-sm font-black uppercase tracking-widest shadow-2xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5 mr-3" /> Initiative Pulse</>}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="voice" className="mt-0 focus-visible:outline-none">
                        <Card className="glass-panel bg-white/1 border-white/5 rounded-[4rem] overflow-hidden">
                            <div className="bg-linear-to-r from-accent/10 to-transparent p-12 border-b border-white/5">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Sparkles className="w-5 h-5 text-accent" />
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-accent font-mono">Neural Synthesis Module</h3>
                                        </div>
                                        <p className="text-lg font-light text-white/40 leading-relaxed">Structural script generation for ElevenLabs integration.</p>
                                    </div>
                                    <Button 
                                        onClick={handleGenerateVoice} 
                                        disabled={isGeneratingVoice}
                                        className="bg-accent hover:bg-accent/80 text-background h-14 px-10 rounded-[1.8rem] text-xs font-black uppercase tracking-widest shadow-xl shadow-accent/20 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {isGeneratingVoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Mic2 className="w-4 h-4 mr-3" /> Forging Script</>}
                                    </Button>
                                </div>
                            </div>
                            <CardContent className="p-12 space-y-12">
                                {voiceScript ? (
                                    <div className="space-y-12 stagger-item">
                                        <div className="bg-white/1 border border-white/5 p-12 rounded-[3.5rem] relative group hover:bg-white/2 transition-all duration-1000">
                                            <p className="text-3xl leading-relaxed text-white/60 font-serif italic text-center max-w-2xl mx-auto">
                                                &quot;{voiceScript}&quot;
                                            </p>
                                            <div className="absolute top-6 right-6">
                                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/5 text-white/20" onClick={() => navigator.clipboard.writeText(voiceScript)}>
                                                    <Copy className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col md:flex-row items-center gap-10 bg-[#0A0A0B] p-10 rounded-[3.5rem] border border-white/5">
                                            <Button 
                                                size="icon" 
                                                disabled={!audioUrl}
                                                onClick={() => {
                                                    const audio = document.getElementById('voice-audio') as HTMLAudioElement;
                                                    if (audio.paused) audio.play();
                                                    else audio.pause();
                                                }}
                                                className="rounded-full bg-accent/10 border border-accent/20 w-24 h-24 hover:bg-accent/20 transition-all active:scale-90 group flex items-center justify-center p-0"
                                            >
                                                <Play className="w-8 h-8 fill-accent text-accent group-hover:scale-110 transition-transform" />
                                            </Button>
                                            <div className="flex-1 space-y-4">
                                                <div className="flex items-center justify-between">
                                                   <p className="text-[10px] font-black uppercase tracking-widest text-white/40 font-mono">Audio // {audioUrl ? 'Synthesis Ready' : 'Awaiting Metadata'}</p>
                                                   <span className="text-[10px] font-mono text-white/10 font-bold uppercase tracking-tighter">Commit v.8.3</span>
                                                </div>
                                                {audioUrl && (
                                                    <audio id="voice-audio" src={audioUrl} />
                                                )}
                                                <div className="h-2 bg-white/5 rounded-full w-full overflow-hidden p-0.5">
                                                    <div className={clsx(
                                                      "h-full bg-accent rounded-full transition-all duration-1000",
                                                      audioUrl ? 'w-full shadow-[0_0_15px_rgba(251,191,36,0.5)]' : 'w-1/3 animate-pulse opacity-20'
                                                    )} />
                                                </div>
                                            </div>
                                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 min-w-[100px] text-center">
                                               <span className="text-xs font-mono text-white/60">0:42 SEC</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-32 text-center space-y-8 opacity-10 italic">
                                        <div className="p-8 bg-white/5 rounded-full inline-block border border-white/5">
                                           <Mic2 className="w-16 h-16" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-[1em] text-white">Neural Script // Null</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
      )}
    </div>
  );
}
