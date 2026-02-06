"use client";

import { useState, useEffect } from "react";
import { 
  Phone, 
  PhoneCall, 
  PhoneMissed, 
  Clock, 
  Calendar,
  PlayCircle,
  FileAudio
} from "lucide-react";

interface CallLog {
  id: string;
  leadId: string;
  leadName: string;
  phoneNumber: string;
  script: string;
  status: 'queued' | 'ringing' | 'in_progress' | 'completed' | 'failed';
  duration?: number;
  recordingUrl?: string;
  timestamp: string;
}

interface VoiceCallLogProps {
  leadId?: string;
  limit?: number;
}

export function VoiceCallLog({ leadId, limit = 10 }: VoiceCallLogProps) {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);

  useEffect(() => {
    fetchCalls();
  }, [leadId]);

  const fetchCalls = async () => {
    try {
      const url = leadId 
        ? `/api/voice?leadId=${leadId}`
        : '/api/voice';
      const response = await fetch(url);
      const data = await response.json();
      
      // Transform calls data
      const callLogs: CallLog[] = data.recentCalls || mockCalls;
      setCalls(limit ? callLogs.slice(0, limit) : callLogs);
    } catch (error) {
      // Use mock data for demo
      setCalls(mockCalls.slice(0, limit));
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Phone className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <PhoneMissed className="w-4 h-4 text-red-500" />;
      case 'ringing':
      case 'in_progress':
        return <PhoneCall className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const scriptLabels: Record<string, string> = {
    cold_call: '❄️ Cold Call',
    follow_up: '📧 Follow-up',
    demo_discussion: '💬 Demo',
    closing: '🎯 Abschluss'
  };

  if (loading) {
    return (
      <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-800 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold flex items-center gap-2">
          <Phone className="w-5 h-5 text-green-500" />
          Anruf-Verlauf
        </h3>
        <span className="text-sm text-slate-400">{calls.length} Anrufe</span>
      </div>

      {/* Call List */}
      <div className="space-y-3">
        {calls.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Phone className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Noch keine Anrufe getätigt</p>
          </div>
        ) : (
          calls.map((call) => (
            <div
              key={call.id}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedCall?.id === call.id
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
              onClick={() => setSelectedCall(call)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getStatusIcon(call.status)}
                  <div>
                    <p className="font-medium">{call.leadName}</p>
                    <p className="text-sm text-slate-400">{call.phoneNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">{formatDate(call.timestamp)}</p>
                  <p className="text-xs text-slate-400">{formatDuration(call.duration)}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs px-2 py-1 bg-slate-800 rounded">
                  {scriptLabels[call.script] || call.script}
                </span>
                
                {call.recordingUrl && (
                  <button className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300">
                    <PlayCircle className="w-4 h-4" />
                    Aufnahme
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Call Detail Modal */}
      {selectedCall && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl p-6 max-w-md w-full border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-bold">Anruf Details</h4>
              <button 
                onClick={() => setSelectedCall(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between p-3 bg-slate-800 rounded-lg">
                <span className="text-slate-400">Status</span>
                <span className={`font-medium ${
                  selectedCall.status === 'completed' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {selectedCall.status}
                </span>
              </div>
              
              <div className="flex justify-between p-3 bg-slate-800 rounded-lg">
                <span className="text-slate-400">Dauer</span>
                <span>{formatDuration(selectedCall.duration)}</span>
              </div>
              
              <div className="flex justify-between p-3 bg-slate-800 rounded-lg">
                <span className="text-slate-400">Skript</span>
                <span>{scriptLabels[selectedCall.script]}</span>
              </div>
              
              <div className="flex justify-between p-3 bg-slate-800 rounded-lg">
                <span className="text-slate-400">Zeitpunkt</span>
                <span>{formatDate(selectedCall.timestamp)}</span>
              </div>
              
              {selectedCall.recordingUrl && (
                <button className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 rounded-lg">
                  <FileAudio className="w-5 h-5" />
                  Aufnahme abspielen
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Mock data for demo
const mockCalls: CallLog[] = [
  {
    id: "call_001",
    leadId: "lead_001",
    leadName: "Pizzeria Da Mario",
    phoneNumber: "+41 79 123 45 67",
    script: "cold_call",
    status: "completed",
    duration: 185,
    recordingUrl: "https://example.com/recording.mp3",
    timestamp: "2026-02-06T10:30:00Z"
  },
  {
    id: "call_002",
    leadId: "lead_002",
    leadName: "Coiffeur Schönheit",
    phoneNumber: "+41 78 987 65 43",
    script: "follow_up",
    status: "completed",
    duration: 245,
    recordingUrl: "https://example.com/recording2.mp3",
    timestamp: "2026-02-06T09:15:00Z"
  },
  {
    id: "call_003",
    leadId: "lead_003",
    leadName: "Schreinerei Meier",
    phoneNumber: "+41 76 555 55 55",
    script: "demo_discussion",
    status: "failed",
    timestamp: "2026-02-05T14:00:00Z"
  }
];
