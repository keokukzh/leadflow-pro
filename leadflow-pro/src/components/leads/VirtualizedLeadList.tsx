"use client";

import { memo, useMemo, useCallback, useState, useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useLeads, LeadFilters } from "@/lib/hooks/useLeads";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/loading";
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter,
  RefreshCw,
  Building2,
  MapPin,
  Star,
  MoreHorizontal
} from "lucide-react";

// ============================================
// VIRTUALIZED LEAD LIST
// Performance: Only renders visible items
// ============================================

interface LeadListProps {
  onLeadSelect?: (leadId: string) => void;
  filters?: LeadFilters;
}

const PAGE_SIZE = 50;

function VirtualizedLeadListInner({ onLeadSelect, filters }: LeadListProps) {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const parentRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error, refetch, isFetching } = useLeads({
    ...filters,
    search: searchQuery || filters?.search,
    page,
    limit: PAGE_SIZE
  });

  const leads = data?.leads || [];
  const totalPages = data?.totalPages || 1;
  const totalLeads = data?.total || 0;

  // Virtualizer for smooth scrolling with large lists
  const rowVirtualizer = useVirtualizer({
    count: leads.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  // Memoized expensive computations
  const statusCounts = useMemo(() => {
    return leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [leads]);

  // Memoized callback to prevent re-renders
  const handleLeadClick = useCallback((leadId: string) => {
    onLeadSelect?.(leadId);
  }, [onLeadSelect]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
        <p className="text-red-600">Fehler beim Laden der Leads</p>
        <Button variant="outline" onClick={() => refetch()} className="mt-2">
          Erneut versuchen
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Search & Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Leads suchen..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Aktualisieren
        </Button>
        
        <span className="text-sm text-slate-400 ml-auto">
          {totalLeads} Leads
        </span>
      </div>

      {/* Virtualized List Container */}
      <div 
        ref={parentRef}
        className="h-[600px] overflow-auto bg-slate-900 rounded-xl border border-slate-800"
      >
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="p-4 border-b border-slate-800 flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="w-48 h-4 mb-2" />
                <Skeleton className="w-32 h-3" />
              </div>
            </div>
          ))
        ) : leads.length === 0 ? (
          // Empty state
          <div className="p-8 text-center">
            <Building2 className="w-12 h-12 mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400">Keine Leads gefunden</p>
          </div>
        ) : (
          // Virtualized items
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const lead = leads[virtualRow.index];
              return (
                <div
                  key={lead.id}
                  className="absolute top-0 left-0 w-full p-4 border-b border-slate-800 hover:bg-slate-800/50 transition-colors cursor-pointer flex items-center gap-4"
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  onClick={() => handleLeadClick(lead.id)}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium flex-shrink-0">
                    {lead.company_name.charAt(0)}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white truncate">
                        {lead.company_name}
                      </span>
                      {lead.rating > 0 && (
                        <span className="flex items-center gap-1 text-xs text-yellow-500">
                          <Star className="w-3 h-3 fill-current" />
                          {lead.rating}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {lead.location}
                      </span>
                      <span>•</span>
                      <span>{lead.industry}</span>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <Badge 
                    variant={
                      lead.status === 'STRATEGY_CREATED' ? 'default' :
                      lead.status === 'PREVIEW_GENERATING' ? 'secondary' :
                      'outline'
                    }
                    className="flex-shrink-0"
                  >
                    {lead.status.replace(/_/g, ' ')}
                  </Badge>
                  
                  {/* Score indicator */}
                  <div className="w-12 flex-shrink-0">
                    <div className="text-xs text-slate-500 mb-1">Score</div>
                    <div className={`text-sm font-medium ${
                      (lead.analysis?.priorityScore || 0) >= 80 ? 'text-green-500' :
                      (lead.analysis?.priorityScore || 0) >= 50 ? 'text-yellow-500' :
                      'text-red-500'
                    }`}>
                      {lead.analysis?.priorityScore || 0}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Zurück
          </Button>
          
          <span className="text-sm text-slate-400">
            Seite {page} von {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Weiter
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Export memoized component
export const VirtualizedLeadList = memo(VirtualizedLeadListInner);
