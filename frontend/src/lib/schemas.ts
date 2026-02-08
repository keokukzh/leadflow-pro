import { z } from "zod";

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
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Ungültiges Telefonformat")
    .optional(),
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
  limit: z.number().optional(),
});

/**
 * Voice Call Schema
 */
export const VoiceCallSchema = z.object({
  lead: LeadSchema,
  prompt: z.string().optional(),
});

/**
 * Site Config Schema (New Architecture)
 */
export type VibeType = 'swiss-minimal' | 'neo-brutalism' | 'luxury-serif' | 'tech-glass' | 'warm-organic';

export interface SiteConfig {
  vibe: VibeType;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    fontHeading: string; // e.g. 'font-serif'
    fontBody: string;    // e.g. 'font-sans'
    radius: '0' | '0.5rem' | '1rem' | '9999px';
    shadow: 'none' | 'soft' | 'hard';
  };
  content: {
    businessName: string;
    hero: {
      headline: string;
      subheadline: string;
      ctaText: string;
      imageKeyword: string;
    };
    services: {
      title: string;
      items: { title: string; description: string; icon: string }[];
    };
    socialProof: {
      badgeText: string;
      stat: string;
      statLabel: string;
    };
    contact: {
      phone: string;
      email: string;
      address: string;
    };
  };
  structure: {
    hero: { variant: 'split-3d' | 'centered-video' | 'minimal-type' | 'immersive-image' };
    features: { variant: 'grid-cards' | 'list-minimal' | 'bento-box' };
    socialProof: { variant: 'ticker' | 'masonry' | 'carousel' };
    cta: { variant: 'floating-card' | 'full-width-gradient' };
  };
}

export type LeadData = z.infer<typeof LeadSchema>;
export type SearchDiscoveryData = z.infer<typeof SearchDiscoverySchema>;
export type VoiceCallData = z.infer<typeof VoiceCallSchema>;
