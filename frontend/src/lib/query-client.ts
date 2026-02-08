"use client";

import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export const queryKeys = {
  leads: ["leads"] as const,
  lead: (id: string) => ["leads", id] as const,
  leadsFiltered: (filters: LeadFilters | Record<string, unknown>) => ["leads", "filtered", filters] as const,
  discovery: ["discovery"] as const,
  analytics: ["analytics"] as const,
  workflows: ["workflows"] as const,
} as const;

export const leadQueries = queryKeys;

export interface LeadFilters {
  status?: string;
  industry?: string;
  location?: string;
  search?: string;
  minScore?: number;
  maxScore?: number;
  page?: number;
  limit?: number;
}
