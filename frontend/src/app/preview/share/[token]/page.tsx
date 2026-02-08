"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface SharedPreviewProps {
  params: { token: string };
}

// ============================================
// SHAREABLE PREVIEW PAGE
// ============================================

export default function SharedPreviewPage({ params }: SharedPreviewProps) {
  const searchParams = useSearchParams();
  const token = params?.token || searchParams?.get("token");
  
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [device, setDevice] = useState<"desktop" | "mobile">("mobile");

  useEffect(() => {
    if (token) {
      fetchPreview(token);
    }
  }, [token]);

  const fetchPreview = async (shareToken: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/preview/generate?token=${shareToken}`);
      if (!response.ok) {
        throw new Error("Preview not found");
      }
      
      // Get the HTML directly from the response
      const html = await response.text();
      setPreviewHtml(html);
    } catch (err) {
      setError("Preview not found or expired");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-5xl mb-4">⏳</div>
          <p className="text-slate-600">Preview wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Preview nicht gefunden</h1>
          <p className="text-slate-600 mb-4">
            Dieser Link ist abgelaufen oder existiert nicht mehr.
          </p>
          <a 
            href="/leads"
            className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Zurück zu Leads
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Device Toggle Header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b px-6 py-3 flex items-center justify-between z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="text-lg">📱</span>
          <span className="font-semibold">Geteilte Vorschau</span>
        </div>
        
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setDevice("mobile")}
            className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
              device === "mobile" ? "bg-white shadow text-slate-800" : "text-slate-500"
            }`}
          >
            📱 Mobile
          </button>
          <button
            onClick={() => setDevice("desktop")}
            className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
              device === "desktop" ? "bg-white shadow text-slate-800" : "text-slate-500"
            }`}
          >
            🖥️ Desktop
          </button>
        </div>
        
        <a
          href="/leads"
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm"
        >
          ✕ Schliessen
        </a>
      </div>

      {/* Preview Frame */}
      <div className="pt-16 flex justify-center min-h-screen p-4">
        <div
          className="bg-white shadow-2xl rounded-3xl overflow-hidden transition-all duration-300"
          style={{
            width: device === "mobile" ? "375px" : "100%",
            maxWidth: device === "mobile" ? "375px" : "100%",
            minHeight: device === "mobile" ? "812px" : "calc(100vh - 120px)"
          }}
        >
          {device === "mobile" && (
            <div className="bg-slate-800 px-4 py-2 flex items-center justify-between rounded-t-3xl">
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="bg-slate-700 px-3 py-1 rounded-full text-xs text-white">
                leadflow.pro
              </div>
              <div className="w-4 h-4" />
            </div>
          )}
          
          <iframe
            srcDoc={previewHtml}
            className="w-full h-full border-0"
            sandbox="allow-same-origin"
            title="Shared Preview"
          />
        </div>
      </div>
    </div>
  );
}
