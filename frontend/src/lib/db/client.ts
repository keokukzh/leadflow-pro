// ============================================
// LeadFlow Pro - Database Client
// ============================================

import { createClient } from '@supabase/supabase-js';
import type { 
  Lead, 
  CreateLeadInput, 
  UpdateLeadInput,
  VoiceCall,
  CreateVoiceCallInput,
  EmailLog,
  CreateEmailInput,
  Activity,
  CreateActivityInput,
  LeadFilters,
  CallFilters,
  EmailFilters
} from './types';

// Initialize Supabase client
// Use service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase credentials not configured');
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

// ============================================
// LEAD OPERATIONS
// ============================================

/**
 * Get all leads with optional filters
 */
export async function getLeads(filters?: LeadFilters): Promise<Lead[]> {
  let query = supabase
    .from('leads')
    .select('*')
    .order('score', { ascending: false });

  if (filters?.status?.length) {
    query = query.in('status', filters.status);
  }
  if (filters?.minScore) {
    query = query.gte('score', filters.minScore);
  }
  if (filters?.maxScore) {
    query = query.lte('score', filters.maxScore);
  }
  if (filters?.assignedTo) {
    query = query.eq('assigned_to', filters.assignedTo);
  }
  if (filters?.industry) {
    query = query.eq('industry', filters.industry);
  }
  if (filters?.location) {
    query = query.eq('location', filters.location);
  }
  if (filters?.search) {
    query = query.ilike('company_name', `%${filters.search}%`);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('❌ Error fetching leads:', error);
    throw new Error(error.message);
  }
  
  return data as Lead[];
}

/**
 * Get a single lead by ID
 */
export async function getLeadById(id: string): Promise<Lead | null> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('❌ Error fetching lead:', error);
    throw new Error(error.message);
  }
  
  return data as Lead;
}

/**
 * Create a new lead
 */
export async function createLead(input: CreateLeadInput): Promise<Lead> {
  // Calculate initial score
  const score = calculateLeadScore(input);
  
  const { data, error } = await supabase
    .from('leads')
    .insert({ ...input, score })
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error creating lead:', error);
    throw new Error(error.message);
  }
  
  // Log activity
  await logActivity({
    lead_id: data.id,
    type: 'note',
    description: 'Lead created',
  });
  
  return data as Lead;
}

/**
 * Update an existing lead
 */
export async function updateLead(id: string, updates: UpdateLeadInput): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error updating lead:', error);
    throw new Error(error.message);
  }
  
  return data as Lead;
}

/**
 * Delete a lead
 */
export async function deleteLead(id: string): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('❌ Error deleting lead:', error);
    throw new Error(error.message);
  }
}

/**
 * Calculate lead score based on reviews and website status
 */
function calculateLeadScore(lead: CreateLeadInput): number {
  let score = 0;
  
  // Review score: up to 20 points
  const reviewScore = Math.min((lead.google_reviews_count || 0) / 10, 20);
  score += reviewScore;
  
  // Rating score: up to 20 points
  const ratingScore = ((lead.google_rating || 0) / 5) * 20;
  score += ratingScore;
  
  // Website penalty: -10 if no website, +5 if has website
  score += lead.website ? 5 : -10;
  
  // Industry bonus
  const industryBonus: Record<string, number> = {
    'restaurant': 5,
    'hotel': 5,
    'handwerk': 3,
    'healthcare': 3,
    'retail': 2,
  };
  score += industryBonus[lead.industry?.toLowerCase() || ''] || 0;
  
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Bulk create leads
 */
export async function createLeadsBulk(inputs: CreateLeadInput[]): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  
  for (const input of inputs) {
    try {
      await createLead(input);
      success++;
    } catch {
      failed++;
    }
  }
  
  return { success, failed };
}

// ============================================
// VOICE CALL OPERATIONS
// ============================================

/**
 * Log a voice call
 */
export async function logVoiceCall(input: CreateVoiceCallInput): Promise<VoiceCall> {
  const { data, error } = await supabase
    .from('voice_calls')
    .insert(input)
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error logging call:', error);
    throw new Error(error.message);
  }
  
  return data as VoiceCall;
}

/**
 * Update call status (for webhooks)
 */
export async function updateCallStatus(
  callSid: string, 
  updates: Partial<VoiceCall>
): Promise<VoiceCall> {
  const { data, error } = await supabase
    .from('voice_calls')
    .update(updates)
    .eq('call_sid', callSid)
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error updating call:', error);
    throw new Error(error.message);
  }
  
  return data as VoiceCall;
}

/**
 * Get calls for a lead
 */
export async function getCallsForLead(leadId: string): Promise<VoiceCall[]> {
  const { data, error } = await supabase
    .from('voice_calls')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Error fetching calls:', error);
    throw new Error(error.message);
  }
  
  return data as VoiceCall[];
}

// ============================================
// EMAIL OPERATIONS
// ============================================

/**
 * Log an email
 */
export async function logEmail(input: CreateEmailInput): Promise<EmailLog> {
  const { data, error } = await supabase
    .from('email_logs')
    .insert(input)
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error logging email:', error);
    throw new Error(error.message);
  }
  
  return data as EmailLog;
}

/**
 * Update email status (for webhooks)
 */
export async function updateEmailStatus(
  messageId: string, 
  updates: { status?: EmailLog['status']; opened_at?: string; clicked_at?: string }
): Promise<EmailLog> {
  const { data, error } = await supabase
    .from('email_logs')
    .update(updates)
    .eq('message_id', messageId)
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error updating email:', error);
    throw new Error(error.message);
  }
  
  return data as EmailLog;
}

/**
 * Get emails for a lead
 */
export async function getEmailsForLead(leadId: string): Promise<EmailLog[]> {
  const { data, error } = await supabase
    .from('email_logs')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Error fetching emails:', error);
    throw new Error(error.message);
  }
  
  return data as EmailLog[];
}

// ============================================
// ACTIVITY OPERATIONS
// ============================================

/**
 * Log an activity
 */
export async function logActivity(input: CreateActivityInput): Promise<Activity> {
  const { data, error } = await supabase
    .from('activities')
    .insert(input)
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error logging activity:', error);
    throw new Error(error.message);
  }
  
  return data as Activity;
}

/**
 * Get activities for a lead
 */
export async function getActivitiesForLead(leadId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Error fetching activities:', error);
    throw new Error(error.message);
  }
  
  return data as Activity[];
}

/**
 * Get recent activities across all leads
 */
export async function getRecentActivities(limit: number = 50): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*, leads(company_name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('❌ Error fetching activities:', error);
    throw new Error(error.message);
  }
  
  return data as Activity[];
}

// ============================================
// ANALYTICS / DASHBOARD STATS
// ============================================

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<{
  totalLeads: number;
  newLeadsThisWeek: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  totalCalls: number;
  callsCompleted: number;
  totalEmails: number;
  emailsOpened: number;
}> {
  // Get lead counts
  const { count: totalLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true });

  const { count: newLeadsThisWeek } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  const { count: hotLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .gte('score', 70);

  const { count: warmLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .gte('score', 40)
    .lt('score', 70);

  const { count: coldLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .lt('score', 40);

  // Get call stats
  const { count: totalCalls } = await supabase
    .from('voice_calls')
    .select('*', { count: 'exact', head: true });

  const { count: callsCompleted } = await supabase
    .from('voice_calls')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  // Get email stats
  const { count: totalEmails } = await supabase
    .from('email_logs')
    .select('*', { count: 'exact', head: true });

  const { count: emailsOpened } = await supabase
    .from('email_logs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'opened');

  return {
    totalLeads: totalLeads || 0,
    newLeadsThisWeek: newLeadsThisWeek || 0,
    hotLeads: hotLeads || 0,
    warmLeads: warmLeads || 0,
    coldLeads: coldLeads || 0,
    totalCalls: totalCalls || 0,
    callsCompleted: callsCompleted || 0,
    totalEmails: totalEmails || 0,
    emailsOpened: emailsOpened || 0,
  };
}

// ============================================
// EXPORT / IMPORT
// ============================================

/**
 * Export leads to CSV format
 */
export async function exportLeadsToCSV(filters?: LeadFilters): Promise<string> {
  const leads = await getLeads(filters);
  
  if (leads.length === 0) return '';
  
  const headers = [
    'company_name',
    'phone',
    'email',
    'industry',
    'location',
    'google_rating',
    'google_reviews_count',
    'score',
    'status',
    'website',
  ];
  
  const rows = leads.map(lead => 
    headers.map(h => {
      const value = (lead as any)[h];
      return typeof value === 'string' && value.includes(',') 
        ? `"${value}"` 
        : value || '';
    }).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Import leads from CSV
 */
export async function importLeadsFromCSV(csvContent: string): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  const inputs: any[] = [];
  const errors: string[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length !== headers.length) {
      errors.push(`Line ${i + 1}: Column count mismatch`);
      continue;
    }
    
    const lead: any = {};
    headers.forEach((header, index) => {
      const value = values[index];
      if (value && value !== '') {
        // Type conversions
        switch (header) {
          case 'google_rating':
            lead.google_rating = parseFloat(value);
            break;
          case 'google_reviews_count':
            lead.google_reviews_count = parseInt(value);
            break;
          case 'score':
            lead.score = parseInt(value);
            break;
          default:
            lead[header] = value;
        }
      }
    });
    
    if (lead.company_name && lead.phone) {
      inputs.push(lead);
    } else {
      errors.push(`Line ${i + 1}: Missing required fields (company_name, phone)`);
    }
  }
  
  const result = await createLeadsBulk(inputs);
  
  return {
    success: result.success,
    failed: result.failed + errors.length,
    errors,
  };
}

// Helper to parse CSV line (handles quoted values)
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim().replace(/^"|"$/g, ''));
  return values;
}
