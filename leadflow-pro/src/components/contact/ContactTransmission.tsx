"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Send, Loader2, ExternalLink, Sparkles, Mic2, Copy, Play, Zap } from "lucide-react";
import { Lead } from "@/lib/actions/server-actions";

interface ContactTransmissionProps {
  selectedLead: Lead | undefined;
  emailSubject: string;
  setEmailSubject: (val: string) => void;
  emailBody: string;
  setEmailBody: (val: string) => void;
  isSending: boolean;
  handleSendEmail: () => void;
  isGeneratingVoice: boolean;
  handleGenerateVoice: () => void;
  voiceScript: string;
  setVoiceScript: (val: string) => void;
  audioUrl: string | null;
  isCalling: boolean;
  handleInitiateCall: () => void;
}

export function ContactTransmission({
  selectedLead,
  emailSubject,
  setEmailSubject,
  emailBody,
  setEmailBody,
  isSending,
  handleSendEmail,
  isGeneratingVoice,
  handleGenerateVoice,
  voiceScript,
  audioUrl,
  isCalling,
  handleInitiateCall
}: Omit<ContactTransmissionProps, 'setVoiceScript'>) {
  if (!selectedLead) return null;

  return (
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
                onChange={(e) => setEmailSubject(e.target.value)}
                className="bg-white/1 border-white/5 h-16 px-8 rounded-4xl font-serif text-lg text-white focus:border-primary/40 transition-all"
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 font-mono ml-4">Payload Content</label>
              <Textarea 
                value={emailBody} 
                onChange={(e) => setEmailBody(e.target.value)}
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
                  <span className="text-sm font-mono text-primary/60 hover:text-primary transition-colors cursor-pointer">/preview/{selectedLead.id}</span>
                </div>
              </div>
              <Button 
                onClick={handleSendEmail} 
                disabled={isSending}
                className="bg-primary hover:bg-primary/80 h-16 px-12 rounded-4xl text-sm font-black uppercase tracking-widest shadow-2xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
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
                </div>
                <div className="flex gap-4">
                  <Button 
                    className="flex-1 bg-accent hover:bg-accent/80 text-white rounded-4xl h-16 shadow-lg shadow-accent/20 group"
                    onClick={handleInitiateCall}
                    disabled={isCalling || !audioUrl}
                  >
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 group-hover:animate-pulse" />
                      <span className="text-xs font-black uppercase tracking-[0.2em]">Initiate Pulse</span>
                    </div>
                  </Button>
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
  );
}
