"use client";

import { useState, useEffect } from "react";
import { 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  Clock, 
  User,
  Play,
  Square,
  Settings,
  Mic,
  FileAudio
} from "lucide-react";

interface VoiceAgentPanelProps {
  leadId?: string;
  leadName?: string;
  phoneNumber?: string;
  onCallComplete?: (result: any) => void;
}

interface VoiceConfig {
  twilio: {
    configured: boolean;
    phoneNumber: string;
  };
  elevenlabs: {
    configured: boolean;
    voiceName: string;
  };
}

interface CallResult {
  success: boolean;
  callSid?: string;
  status: string;
  message: string;
}

export function VoiceAgentPanel({ 
  leadId, 
  leadName, 
  phoneNumber,
  onCallComplete 
}: VoiceAgentPanelProps) {
  const [config, setConfig] = useState<VoiceConfig | null>(null);
  const [scripts, setScripts] = useState<Record<string, any>>({});
  const [selectedScript, setSelectedScript] = useState<string>("cold_call");
  const [isCalling, setIsCalling] = useState(false);
  const [callResult, setCallResult] = useState<CallResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch("/api/voice");
      const data = await response.json();
      setConfig(data.config);
      setScripts(data.scripts);
    } catch (err) {
      setError("Failed to load voice config");
    }
  };

  const initiateCall = async () => {
    if (!phoneNumber || !leadId) {
      setError("Phone number and lead ID required");
      return;
    }

    setIsCalling(true);
    setError(null);
    setCallResult(null);

    try {
      const response = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          phoneNumber,
          script: selectedScript
        })
      });

      const result = await response.json();
      setCallResult(result);

      if (result.success && onCallComplete) {
        onCallComplete(result);
      }
    } catch (err) {
      setError("Failed to initiate call");
    } finally {
      setIsCalling(false);
    }
  };

  const endCall = () => {
    setIsCalling(false);
    setCallResult(null);
  };

  const scriptOptions = [
    { value: "cold_call", label: "❄️ Cold Call", desc: "Erstkontakt" },
    { value: "follow_up", label: "📧 Follow-up", desc: "Nach Demo" },
    { value: "demo_discussion", label: "💬 Demo Besprechung", desc: "Interessent" },
    { value: "closing", label: "🎯 Abschluss", desc: "Verkauf" }
  ];

  return (
    <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
            <PhoneCall className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-bold">Voice Agent</h3>
            <p className="text-xs text-slate-400">Twilio + ElevenLabs</p>
          </div>
        </div>
        
        {/* Status Indicators */}
        <div className="flex gap-2">
          <span className={`px-2 py-1 rounded text-xs ${config?.twilio?.configured ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            Twilio
          </span>
          <span className={`px-2 py-1 rounded text-xs ${config?.elevenlabs?.configured ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            ElevenLabs
          </span>
        </div>
      </div>

      {/* Lead Info */}
      {leadName && (
        <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg mb-4">
          <User className="w-5 h-5 text-slate-400" />
          <div>
            <p className="font-medium">{leadName}</p>
            <p className="text-xs text-slate-400">{phoneNumber || "No phone number"}</p>
          </div>
        </div>
      )}

      {/* Script Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Gesprächs-Skript</label>
        <div className="grid grid-cols-2 gap-2">
          {scriptOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedScript(option.value)}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedScript === option.value
                  ? "border-green-500 bg-green-500/10"
                  : "border-slate-700 hover:border-slate-600"
              }`}
            >
              <p className="text-sm font-medium">{option.label}</p>
              <p className="text-xs text-slate-400">{option.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Script Preview */}
      {scripts[selectedScript] && (
        <div className="p-3 bg-slate-800 rounded-lg mb-4">
          <p className="text-xs text-slate-400 mb-2">Skript Vorschau:</p>
          <p className="text-sm text-slate-300">
            {scripts[selectedScript].intro}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Call Result */}
      {callResult && (
        <div className={`p-3 rounded-lg mb-4 ${
          callResult.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
        }`}>
          <div className="flex items-center gap-2">
            {callResult.success ? (
              <Phone className="w-5 h-5 text-green-500" />
            ) : (
              <PhoneOff className="w-5 h-5 text-red-500" />
            )}
            <div>
              <p className="font-medium">{callResult.message}</p>
              {callResult.callSid && (
                <p className="text-xs text-slate-400">Call SID: {callResult.callSid}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {!isCalling ? (
          <button
            onClick={initiateCall}
            disabled={!phoneNumber || !leadId}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            <Phone className="w-5 h-5" />
            Anrufen
          </button>
        ) : (
          <button
            onClick={endCall}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
          >
            <Square className="w-5 h-5" />
            Auflegen
          </button>
        )}
        
        <button className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Dial */}
      <div className="mt-4 pt-4 border-t border-slate-800">
        <p className="text-xs text-slate-400 mb-2">Schnellwahl:</p>
        <div className="flex gap-2">
          <input
            type="tel"
            placeholder="+41..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          />
          <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg">
            <Mic className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Loading skeleton
export function VoiceAgentSkeleton() {
  return (
    <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 animate-pulse">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-slate-800 rounded-lg" />
        <div>
          <div className="w-24 h-4 bg-slate-800 rounded mb-2" />
          <div className="w-16 h-3 bg-slate-800 rounded" />
        </div>
      </div>
      <div className="h-20 bg-slate-800 rounded-lg mb-4" />
      <div className="h-12 bg-slate-800 rounded-lg" />
    </div>
  );
}
