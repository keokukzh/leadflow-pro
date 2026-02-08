import { z } from 'zod';

// --- Shared Types ---

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// --- Validation Schemas ---

/**
 * Lead Schema for basic validation
 */
export const LeadSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name ist erforderlich"),
  city: z.string().optional(),
  vicinity: z.string().min(1, "Adresse ist erforderlich"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Ungültiges Telefonformat").optional(),
  website: z.string().url().nullable().optional(),
  rating: z.number().min(0).max(5).optional(),
  industry: z.string().min(1, "Branche ist erforderlich"),
});

/**
 * Search Discovery Schema
 */
export const SearchDiscoverySchema = z.object({
  industry: z.string().min(1),
  locations: z.union([z.string(), z.array(z.string())]),
  missionId: z.string().optional(),
});

/**
 * Voice Call Schema
 */
export const VoiceCallSchema = z.object({
  lead: LeadSchema,
  prompt: z.string().optional(),
});

export type LeadData = z.infer<typeof LeadSchema>;
export type SearchDiscoveryData = z.infer<typeof SearchDiscoverySchema>;
export type VoiceCallData = z.infer<typeof VoiceCallSchema>;
