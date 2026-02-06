import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leadQueries, LeadFilters } from "@/lib/query-client";
import { 
  getLeads, 
  getLeadById, 
  getMissions,
  updateLeadStatus,
  generateSiteConfig 
} from "@/lib/actions/server-actions";
import { Lead } from "@/lib/actions/server-actions";

export function useLeads(filters?: LeadFilters) {
  return useQuery({
    queryKey: leadQueries.leadsFiltered(filters || {}),
    queryFn: () => getLeads(filters),
    staleTime: 60 * 1000,
  });
}

export function useAllLeads() {
  return useQuery({
    queryKey: leadQueries.leads,
    queryFn: () => getLeads({}),
    staleTime: 60 * 1000,
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: leadQueries.lead(id),
    queryFn: () => getLeadById(id),
    enabled: !!id,
  });
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Lead['status'] }) =>
      updateLeadStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: leadQueries.leads });
      const previousLeads = queryClient.getQueryData(leadQueries.leads);
      
      queryClient.setQueryData(
        leadQueries.leads,
        (old: Lead[]) => old.map(lead => 
          lead.id === id ? { ...lead, status } : lead
        )
      );
      
      return { previousLeads };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousLeads) {
        queryClient.setQueryData(leadQueries.leads, context.previousLeads);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: leadQueries.leads });
    },
  });
}

export function useGenerateSiteConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (leadId: string) => generateSiteConfig(leadId),
    onMutate: async (leadId) => {
      await queryClient.cancelQueries({ queryKey: leadQueries.lead(leadId) });
      const previousLead = queryClient.getQueryData(leadQueries.lead(leadId));
      
      queryClient.setQueryData(
        leadQueries.lead(leadId),
        (old: Lead | undefined) => 
          old ? { ...old, status: 'PREVIEW_GENERATING' as const } : old
      );
      
      return { previousLead };
    },
    onError: (_err, _leadId, context) => {
      if (context?.previousLead) {
        queryClient.setQueryData(leadQueries.lead(_leadId), context.previousLead);
      }
    },
    onSettled: (_data, _error, leadId) => {
      queryClient.invalidateQueries({ queryKey: leadQueries.lead(leadId) });
      queryClient.invalidateQueries({ queryKey: leadQueries.leads });
    },
  });
}

export function useMissions() {
  return useQuery({
    queryKey: queryKeys.discovery,
    queryFn: () => getMissions(),
    staleTime: 30 * 1000,
  });
}

export function useTrackEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (event: any) =>
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      }).then(res => res.json()),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics });
    },
  });
}

export function useRefreshLeads() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: leadQueries.leads });
  };
}
