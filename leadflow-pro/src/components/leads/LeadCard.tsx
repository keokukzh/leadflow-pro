import { memo, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Star, Calendar, Sparkles } from "lucide-react";

// ============================================
// MEMOIZED LEAD CARD
// Performance: Prevents re-renders of unchanged leads
// ============================================

interface LeadCardProps {
  lead: {
    id: string;
    company_name: string;
    location: string;
    industry: string;
    rating?: number;
    status: string;
    created_at: string;
    analysis?: {
      priorityScore?: number;
    };
  };
  onClick?: () => void;
  isSelected?: boolean;
}

export const LeadCard = memo(function LeadCard({ lead, onClick, isSelected }: LeadCardProps) {
  const priorityScore = lead.analysis?.priorityScore || 0;
  
  const scoreColor = useMemo(() => {
    if (priorityScore >= 80) return "text-green-500";
    if (priorityScore >= 50) return "text-yellow-500";
    return "text-red-500";
  }, [priorityScore]);

  const statusVariant = useMemo(() => {
    switch (lead.status) {
      case 'STRATEGY_CREATED': return 'default';
      case 'PREVIEW_GENERATING': return 'secondary';
      case 'COMPLETED': return 'outline';
      default: return 'ghost';
    }
  }, [lead.status]);

  return (
    <div
      onClick={onClick}
      className={`
        p-4 rounded-xl border transition-all cursor-pointer
        ${isSelected 
          ? "bg-blue-500/10 border-blue-500/50" 
          : "bg-slate-900 border-slate-800 hover:bg-slate-800/50"
        }
      `}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {lead.company_name.charAt(0)}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-white truncate">
              {lead.company_name}
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {lead.location}
            </span>
            <span>•</span>
            <span>{lead.industry}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant={statusVariant} className="text-xs">
              {lead.status.replace(/_/g, ' ')}
            </Badge>
            
            {lead.rating && lead.rating > 0 && (
              <span className="flex items-center gap-1 text-xs text-yellow-500">
                <Star className="w-3 h-3 fill-current" />
                {lead.rating}
              </span>
            )}

            {lead.status === 'STRATEGY_CREATED' && (
              <span className="flex items-center gap-1 text-[10px] text-purple-400 font-bold uppercase tracking-wider bg-purple-500/10 px-2 py-0.5 rounded-sm">
                <Sparkles className="w-2.5 h-2.5" />
                Stitch Ready
              </span>
            )}
            
            <span className="flex items-center gap-1 text-xs text-slate-500 ml-auto">
              <Calendar className="w-3 h-3" />
              {new Date(lead.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        
        {/* Score */}
        <div className="text-right flex-shrink-0">
          <div className="text-xs text-slate-500 mb-1">Score</div>
          <div className={`text-2xl font-bold ${scoreColor}`}>
            {priorityScore}
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================
// MEMOIZED LEAD GRID
// Performance: Uses React.memo to prevent unnecessary re-renders
// ============================================

interface LeadGridProps {
  leads: LeadCardProps['lead'][];
  onLeadClick?: (id: string) => void;
  selectedId?: string;
  loading?: boolean;
}

export const LeadGrid = memo(function LeadGrid({ 
  leads, 
  onLeadClick, 
  selectedId,
  loading 
}: LeadGridProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl bg-slate-900 border border-slate-800 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-800" />
              <div className="flex-1">
                <div className="h-4 bg-slate-800 rounded w-48 mb-2" />
                <div className="h-3 bg-slate-800 rounded w-32" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="p-12 text-center bg-slate-900 rounded-xl border border-slate-800">
        <Building2 className="w-16 h-16 mx-auto text-slate-600 mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Keine Leads gefunden</h3>
        <p className="text-slate-400">Passen Sie Ihre Filter an oder generieren Sie neue Leads.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {leads.map((lead) => (
        <LeadCard
          key={lead.id}
          lead={lead}
          onClick={() => onLeadClick?.(lead.id)}
          isSelected={lead.id === selectedId}
        />
      ))}
    </div>
  );
});

// ============================================
// STATS COMPONENTS
// Memoized to prevent re-renders when parent updates
// ============================================

interface StatsGridProps {
  stats: {
    total: number;
    new: number;
    inProgress: number;
    completed: number;
  };
}

export const StatsGrid = memo(function StatsGrid({ stats }: StatsGridProps) {
  const items = useMemo(() => [
    { label: "Total", value: stats.total, color: "text-white", bg: "bg-slate-800" },
    { label: "Neu", value: stats.new, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "In Bearbeitung", value: stats.inProgress, color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { label: "Abgeschlossen", value: stats.completed, color: "text-green-400", bg: "bg-green-500/10" },
  ], [stats]);

  return (
    <div className="grid grid-cols-4 gap-4">
      {items.map((item) => (
        <div key={item.label} className={`p-4 rounded-xl ${item.bg}`}>
          <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
          <div className="text-sm text-slate-400">{item.label}</div>
        </div>
      ))}
    </div>
  );
});
