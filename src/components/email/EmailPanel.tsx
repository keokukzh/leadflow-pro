"use client";

import { useState, useEffect } from "react";
import { 
  Mail, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  MousePointer,
  FileText,
  Loader2
} from "lucide-react";

interface EmailPanelProps {
  leadId?: string;
  leadName?: string;
  leadEmail?: string;
  previewUrl?: string;
  onEmailSent?: (result: any) => void;
}

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
}

export function EmailPanel({ 
  leadId, 
  leadName, 
  leadEmail, 
  previewUrl,
  onEmailSent 
}: EmailPanelProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("lead_intro");
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/email");
      const data = await response.json();
      setTemplates([
        { 
          id: "lead_intro", 
          name: "🎁 Lead Intro", 
          description: "Kostenlose Website-Vorschau",
          preview: "Grüezi... Website-Vorschau..."
        },
        { 
          id: "demo_sent", 
          name: "📋 Demo Gesendet", 
          description: "Vorschau ist bereit",
          preview: "Ihre Website-Vorschau ist jetzt online!"
        },
        { 
          id: "follow_up", 
          name: "📞 Follow-up", 
          description: "Nach 48h nachfassen",
          preview: "Haben Sie die Vorschau gesehen?"
        }
      ]);
    } catch (err) {
      setError("Failed to load templates");
    }
  };

  const sendEmail = async () => {
    if (!leadEmail || !leadId) {
      setError("Lead email and ID required");
      return;
    }

    setIsSending(true);
    setError(null);
    setSendResult(null);

    try {
      const response = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: leadEmail,
          template: selectedTemplate,
          data: {
            company_name: leadName || "Ihr Unternehmen",
            contact_name: leadName || "Sehr geehrte/r Frau/Herr",
            preview_url: previewUrl || "https://leadflow.pro"
          },
          leadId
        })
      });

      const result = await response.json();
      setSendResult(result);

      if (result.success && onEmailSent) {
        onEmailSent(result);
      }
    } catch (err) {
      setError("Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  const templateOptions = [
    { 
      value: "lead_intro", 
      label: "🎁 Lead Intro",
      desc: "Erstkontakt - Kostenlose Vorschau",
      color: "bg-purple-500"
    },
    { 
      value: "demo_sent", 
      label: "📋 Demo Sent",
      desc: "Vorschau ist bereit",
      color: "bg-blue-500"
    },
    { 
      value: "follow_up", 
      label: "📞 Follow-up",
      desc: "Nach 48h nachfassen",
      color: "bg-green-500"
    }
  ];

  return (
    <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-bold">Email Automation</h3>
            <p className="text-xs text-slate-400">via Resend</p>
          </div>
        </div>
        
        {/* Status */}
        <span className={`px-2 py-1 rounded text-xs ${
          sendResult?.success ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'
        }`}>
          {sendResult?.success ? '✅ Gesendet' : 'Bereit'}
        </span>
      </div>

      {/* Lead Info */}
      {leadName && (
        <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg mb-4">
          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-blue-400">
              {leadName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium">{leadName}</p>
            <p className="text-xs text-slate-400">{leadEmail || "No email"}</p>
          </div>
        </div>
      )}

      {/* Template Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Email Template</label>
        <div className="grid grid-cols-1 gap-2">
          {templateOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedTemplate(option.value)}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedTemplate === option.value
                  ? `border-${option.color.replace('bg-', '')} bg-slate-800`
                  : "border-slate-700 hover:border-slate-600"
              }`}
            >
              <p className="font-medium">{option.label}</p>
              <p className="text-xs text-slate-400">{option.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Template Preview */}
      <div className="p-3 bg-slate-800 rounded-lg mb-4">
        <p className="text-xs text-slate-400 mb-2">Vorschau:</p>
        <div className="text-sm text-slate-300 line-clamp-3">
          {selectedTemplate === "lead_intro" && "Grüezi... Wir haben gesehen, dass Sie sehr viele positive Bewertungen haben... Kostenlose Website-Vorschau..."}
          {selectedTemplate === "demo_sent" && "Grüezi... Ihre Website-Vorschau ist jetzt online! Modernes Schweizer Design..."}
          {selectedTemplate === "follow_up" && "Grüezi... Haben Sie die Website-Vorschau schon gesehen? Wir sind gespannt auf Ihr Feedback..."}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Send Result */}
      {sendResult && (
        <div className={`p-3 rounded-lg mb-4 ${
          sendResult.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
        }`}>
          <div className="flex items-center gap-2">
            {sendResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <div>
              <p className="font-medium">
                {sendResult.success ? "Email gesendet!" : "Fehler"}
              </p>
              {sendResult.messageId && (
                <p className="text-xs text-slate-400">ID: {sendResult.messageId}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Send Button */}
      <button
        onClick={sendEmail}
        disabled={!leadEmail || !leadId || isSending}
        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
      >
        {isSending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Sende...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Email senden
          </>
        )}
      </button>

      {/* Quick Stats */}
      <div className="mt-4 pt-4 border-t border-slate-800">
        <p className="text-xs text-slate-400 mb-2">Email Analytics:</p>
        <div className="flex gap-4">
          <div className="flex items-center gap-1 text-sm">
            <Eye className="w-4 h-4 text-slate-400" />
            <span>0</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <MousePointer className="w-4 h-4 text-slate-400" />
            <span>0</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading skeleton
export function EmailPanelSkeleton() {
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
