// ============================================
// LeadFlow Pro - Database Types
// ============================================

export interface Lead {
  id: string;
  company_name: string;
  industry?: string;
  location?: string;
  website?: string;
  phone?: string;
  email?: string;
  google_rating?: number;
  google_reviews_count?: number;
  score: number;
  status: LeadStatus;
  source?: string;
  notes?: string;
  assigned_to?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type LeadStatus = 
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'DEMO_SENT'
  | 'INTERESTED'
  | 'PROPOSAL'
  | 'CLOSED_WON'
  | 'CLOSED_LOST'
  | 'DO_NOT_CONTACT';

export interface VoiceCall {
  id: string;
  lead_id?: string;
  provider: 'twilio' | 'vapi';
  call_sid?: string;
  phone_number: string;
  status: CallStatus;
  duration?: number;
  recording_url?: string;
  transcript?: string;
  cost?: number;
  started_at?: string;
  ended_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export type CallStatus = 
  | 'queued'
  | 'ringing'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'busy'
  | 'no_answer';

export interface EmailLog {
  id: string;
  lead_id?: string;
  provider: 'resend';
  email: string;
  template?: EmailTemplate;
  subject?: string;
  status: EmailStatus;
  opened_at?: string;
  clicked_at?: string;
  message_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export type EmailTemplate = 
  | 'lead_intro'
  | 'demo_sent'
  | 'follow_up'
  | 'newsletter';

export type EmailStatus = 
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'failed';

export interface Activity {
  id: string;
  lead_id: string;
  type: ActivityType;
  description?: string;
  metadata?: Record<string, any>;
  created_by?: string;
  created_at: string;
}

export type ActivityType = 
  | 'call'
  | 'email'
  | 'note'
  | 'status_change'
  | 'website_created'
  | 'demo_sent'
  | 'proposal_sent';

export interface PreviewSent {
  id: string;
  lead_id: string;
  template_id: string;
  preview_url: string;
  status: 'sent' | 'viewed' | 'approved' | 'rejected';
  viewed_at?: string;
  created_at: string;
}

// ============================================
// Input Types (for creating records)
// ============================================

export interface CreateLeadInput {
  company_name: string;
  industry?: string;
  location?: string;
  website?: string;
  phone?: string;
  email?: string;
  google_rating?: number;
  google_reviews_count?: number;
  source?: string;
  notes?: string;
  assigned_to?: string;
}

export interface UpdateLeadInput {
  company_name?: string;
  industry?: string;
  location?: string;
  website?: string;
  phone?: string;
  email?: string;
  google_rating?: number;
  google_reviews_count?: number;
  score?: number;
  status?: LeadStatus;
  source?: string;
  notes?: string;
  assigned_to?: string;
  metadata?: Record<string, any>;
}

export interface CreateVoiceCallInput {
  lead_id?: string;
  provider: 'twilio' | 'vapi';
  call_sid?: string;
  phone_number: string;
  status: CallStatus;
  duration?: number;
  recording_url?: string;
  transcript?: string;
  cost?: number;
  started_at?: string;
  ended_at?: string;
  metadata?: Record<string, any>;
}

export interface CreateEmailInput {
  lead_id?: string;
  provider?: 'resend';
  email: string;
  template?: EmailTemplate;
  subject?: string;
  status?: EmailStatus;
  message_id?: string;
  metadata?: Record<string, any>;
}

export interface CreateActivityInput {
  lead_id: string;
  type: ActivityType;
  description?: string;
  metadata?: Record<string, any>;
  created_by?: string;
}

export interface CreatePreviewInput {
  lead_id: string;
  template_id: string;
  preview_url: string;
  status?: 'sent' | 'viewed' | 'approved' | 'rejected';
}

// ============================================
// Filter Types
// ============================================

export interface LeadFilters {
  status?: LeadStatus[];
  minScore?: number;
  maxScore?: number;
  assignedTo?: string;
  industry?: string;
  location?: string;
  source?: string;
  search?: string;
}

export interface CallFilters {
  lead_id?: string;
  provider?: 'twilio' | 'vapi';
  status?: CallStatus[];
  fromDate?: string;
  toDate?: string;
}

export interface EmailFilters {
  lead_id?: string;
  template?: EmailTemplate;
  status?: EmailStatus[];
  fromDate?: string;
  toDate?: string;
}

// ============================================
// Analytics Types
// ============================================

export interface DashboardStats {
  totalLeads: number;
  newLeadsThisWeek: number;
  leadsByStatus: Record<LeadStatus, number>;
  leadsByScore: { hot: number; warm: cold: number };
  totalCalls: number;
  totalEmails: number;
  emailsOpened: number;
  conversionRate: number;
}

export interface LeadScoreBreakdown {
  baseScore: number;
  reviewScore: number;
  websiteScore: number;
  industryScore: number;
  total: number;
}
