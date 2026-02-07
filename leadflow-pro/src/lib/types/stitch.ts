import { Lead } from "@/lib/actions/server-actions";

export interface LeadWithStrategy extends Lead {
  strategy?: string;
}

export interface StitchContext {
  lead: LeadWithStrategy;
  prompt: string;
}

export type ContactStatus = 'PENDING' | 'CONTACTED' | 'REPLIED' | 'FAILED';
