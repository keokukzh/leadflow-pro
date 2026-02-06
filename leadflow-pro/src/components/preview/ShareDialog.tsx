"use client";

interface ShareDialogProps {
  url: string;
  token: string;
  onCopy: () => void;
  onClose: () => void;
}

export function ShareDialog({ url, token, onCopy, onClose }: ShareDialogProps) {
  const shortUrl = url.replace("/preview/share/", "/p/");
  
  return (
    <div className="fixed bottom-6 right-6 bg-white rounded-xl shadow-xl p-4 max-w-sm z-50 animate-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">🔗 Teilen</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Direkter Link</label>
          <div className="flex gap-2">
            <code className="flex-1 bg-slate-100 px-3 py-2 rounded text-sm truncate">
              {shortUrl}
            </code>
            <button
              onClick={onCopy}
              className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Kopieren
            </button>
          </div>
        </div>
        
        <div className="pt-2 border-t">
          <p className="text-xs text-slate-500">
            Gültig für 7 Tage • Keine Anmeldung erforderlich
          </p>
        </div>
      </div>
    </div>
  );
}
