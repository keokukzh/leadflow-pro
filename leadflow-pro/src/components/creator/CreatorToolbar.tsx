
import { Button } from "@/components/ui/button";
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  Sparkles, 
  Copy,
  CheckCircle,
  ExternalLink
} from "lucide-react";
import { clsx } from "clsx";

interface CreatorToolbarProps {
  currentDevice: "desktop" | "tablet" | "mobile";
  onDeviceChange: (device: "desktop" | "tablet" | "mobile") => void;
  onGenerate: () => void;
  isGenerating: boolean;
  previewUrl?: string;
  onCopyLink: () => void;
  isCopied: boolean;
  onOpenPreview: () => void;
}

export function CreatorToolbar({
  currentDevice,
  onDeviceChange,
  onGenerate,
  isGenerating,
  previewUrl,
  onCopyLink,
  isCopied,
  onOpenPreview
}: CreatorToolbarProps) {
  return (
    <div className="h-20 border-b border-white/5 bg-slate-950/40 backdrop-blur-xl flex items-center justify-between px-8 z-30 relative">
      <div className="flex items-center gap-6">
        <div className="flex bg-white/[0.03] p-1.5 rounded-2xl border border-white/5 shadow-inner">
          <Button 
            variant="ghost" 
            size="sm" 
            className={clsx(
              "h-9 w-9 p-0 rounded-xl transition-all duration-500",
              currentDevice === "desktop" 
                ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] ring-1 ring-white/20" 
                : "text-white/30 hover:text-white hover:bg-white/5"
            )}
            onClick={() => onDeviceChange("desktop")}
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={clsx(
              "h-9 w-9 p-0 rounded-xl transition-all duration-500",
              currentDevice === "tablet" 
                ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] ring-1 ring-white/20" 
                : "text-white/30 hover:text-white hover:bg-white/5"
            )}
            onClick={() => onDeviceChange("tablet")}
          >
            <Tablet className="h-4 w-4" />
          </Button>
           <Button 
            variant="ghost" 
            size="sm" 
            className={clsx(
              "h-9 w-9 p-0 rounded-xl transition-all duration-500",
              currentDevice === "mobile" 
                ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] ring-1 ring-white/20" 
                : "text-white/30 hover:text-white hover:bg-white/5"
            )}
            onClick={() => onDeviceChange("mobile")}
          >
            <Smartphone className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="h-8 w-px bg-white/5" />
        
        <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.2em] text-accent/50 mb-0.5 font-bold">Viewport</span>
            <span className="text-sm text-white/90 font-serif lowercase italic">
                {currentDevice} mode
            </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 mr-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onOpenPreview}
              disabled={!previewUrl}
              className="h-10 px-4 text-white/50 hover:text-white hover:bg-white/5 rounded-xl border border-white/0 hover:border-white/10 transition-all duration-500"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Live Preview
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onCopyLink} 
              disabled={!previewUrl}
              className="h-10 px-4 text-white/50 hover:text-white hover:bg-white/5 rounded-xl border border-white/0 hover:border-white/10 transition-all duration-500"
            >
              {isCopied ? <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> : <Copy className="h-4 w-4 mr-2" />}
              Share Link
            </Button>
        </div>

        <Button 
          variant="default" 
          size="sm" 
          onClick={onGenerate}
          disabled={isGenerating || !previewUrl}
          className="h-10 px-6 bg-primary hover:bg-primary/90 text-white shadow-[0_8px_24px_rgba(155,35,53,0.3)] rounded-xl border border-white/10 group transition-all duration-500"
        >
          <Sparkles className={clsx("h-4 w-4 mr-2 transition-transform duration-700 group-hover:rotate-12", isGenerating ? 'animate-pulse' : 'text-accent')} />
          {isGenerating ? "Synthesizing..." : "Generate New Core"}
        </Button>
      </div>
    </div>
  );
}
