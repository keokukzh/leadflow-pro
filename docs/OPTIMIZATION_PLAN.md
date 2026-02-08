# LeadFlow Pro - Optimization Plan 2026-02-06

## Executive Summary

LeadFlow Pro is currently at **~85% production readiness**. This document outlines a comprehensive optimization plan to reach **98% production readiness**.

---

## Current State Analysis

### ✅ Completed Features
| Feature | Status | Quality |
|---------|-------- Lead Finding|---------|
| (Google Places) | ✅ Working | High |
| Email Automation (Resend) | ✅ Working | High |
| Voice Agent (Twilio) | ⚠️ Pending | Medium |
| Dashboard UI | ✅ Working | High |
| Creator Page | ✅ Working | High |
| Templates (Swiss Design) | ✅ Working | High |
| Database Schema | ⚠️ Basic | Medium |
| Analytics | ⚠️ Basic | Medium |
| Health Check | ✅ Working | High |

### ⚠️ Areas Needing Improvement
1. **Database** - Missing tables for calls, emails, activities
2. **Voice** - Needs VAPI.ai integration
3. **Workflow Automation** - Not implemented
4. **Lead Management** - Basic CRUD only
5. **Export/Import** - Not implemented
6. **Settings** - No settings page
7. **Analytics** - Basic stats only
8. **Testing** - No test suite

---

## Phase 1: Database Enhancement (Priority: HIGH)

### 1.1 Complete Schema

```sql
-- Enhanced Supabase Schema

-- Leads Table (existing, but needs updates)
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    industry TEXT,
    location TEXT,
    website TEXT,
    phone TEXT,
    email TEXT,
    google_rating FLOAT,
    google_reviews_count INTEGER,
    score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'NEW',
    source TEXT,
    notes TEXT,
    assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice Calls Table
CREATE TABLE IF NOT EXISTS voice_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id),
    provider TEXT DEFAULT 'twilio', -- 'twilio' or 'vapi'
    call_sid TEXT,
    phone_number TEXT,
    status TEXT DEFAULT 'queued', -- queued, ringing, in_progress, completed, failed
    duration INTEGER, -- seconds
    recording_url TEXT,
    transcript TEXT,
    cost DECIMAL(10,4),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Logs Table
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id),
    provider TEXT DEFAULT 'resend',
    email TEXT NOT NULL,
    template TEXT, -- 'lead_intro', 'demo_sent', 'follow_up'
    subject TEXT,
    status TEXT DEFAULT 'sent', -- sent, delivered, opened, clicked, bounced
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    message_id TEXT, -- Resend message ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activities Table (for timeline)
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id),
    type TEXT, -- 'call', 'email', 'note', 'status_change'
    description TEXT,
    metadata JSONB,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_score ON leads(score DESC);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);
CREATE INDEX idx_calls_lead ON voice_calls(lead_id);
CREATE INDEX idx_emails_lead ON email_logs(lead_id);
CREATE INDEX idx_activities_lead ON activities(lead_id);
CREATE INDEX idx_activities_created ON activities(created_at DESC);
```

### 1.2 Database Service Layer

```typescript
// leadflow-pro/src/lib/db/db-client.ts

import { createClient } from '@supabase/supabase-js';
import { Lead, VoiceCall, EmailLog, Activity } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Lead Operations
export async function getLeads(filters?: LeadFilters): Promise<Lead[]> {
  let query = supabase.from('leads').select('*');
  
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.minScore) query = query.gte('score', filters.minScore);
  if (filters?.assignedTo) query = query.eq('assigned_to', filters.assignedTo);
  
  const { data, error } = await query.order('score', { ascending: false });
  if (error) throw error;
  return data as Lead[];
}

export async function createLead(lead: CreateLeadInput): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .insert(lead)
    .select()
    .single();
  
  if (error) throw error;
  return data as Lead;
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Lead;
}

// Call Logging
export async function logVoiceCall(call: CreateVoiceCallInput): Promise<VoiceCall> {
  const { data, error } = await supabase
    .from('voice_calls')
    .insert(call)
    .select()
    .single();
  
  if (error) throw error;
  return data as VoiceCall;
}

// Email Logging  
export async function logEmail(email: CreateEmailInput): Promise<EmailLog> {
  const { data, error } = await supabase
    .from('email_logs')
    .insert(email)
    .select()
    .single();
  
  if (error) throw error;
  return data as EmailLog;
}

// Activity Logging
export async function logActivity(activity: CreateActivityInput): Promise<Activity> {
  const { data, error } = await supabase
    .from('activities')
    .insert(activity)
    .select()
    .single();
  
  if (error) throw error;
  return data as Activity;
}
```

---

## Phase 2: VAPI.ai Integration (Priority: HIGH)

### 2.1 Complete VAPI Service

```typescript
// leadflow-pro/src/services/voice/vapi/vapiService.ts

import { VapiService } from './vapi-types';

interface Lead {
  id: string;
  company_name: string;
  phone: string;
  email?: string;
  industry?: string;
  location?: string;
}

interface VapiConfig {
  apiKey: string;
  assistantId: string;
  phoneNumber: string;
}

export class LeadFlowVapiService {
  private config: VapiConfig;
  private baseUrl = 'https://api.vapi.ai';

  constructor(config: VapiConfig) {
    this.config = config;
  }

  async initiateColdCall(lead: Lead): Promise<{ success: boolean; callId: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          assistant_id: this.config.assistantId,
          phone_number: {
            number: this.config.phoneNumber,
            display_name: 'LeadFlow Pro',
          },
          customer: {
            number: lead.phone,
            name: lead.company_name,
          },
          variables: {
            company_name: lead.company_name,
            contact_name: lead.company_name.split(' ')[0],
            industry: lead.industry || 'local business',
            location: lead.location || 'Switzerland',
          },
          metadata: {
            lead_id: lead.id,
            lead_source: 'cold_outreach',
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, callId: '', error: error.message };
      }

      const data = await response.json();
      return { success: true, callId: data.id };
    } catch (error) {
      return { success: false, callId: '', error: String(error) };
    }
  }

  async getCallStatus(callId: string): Promise<VapiCallStatus> {
    const response = await fetch(`${this.baseUrl}/call/${callId}`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    });
    return await response.json();
  }

  async endCall(callId: string): Promise<boolean> {
    try {
      await fetch(`${this.baseUrl}/call/${callId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  async getCallRecording(callId: string): Promise<string | null> {
    const status = await this.getCallStatus(callId);
    return status.recording_url || null;
  }
}

export function createVapiService(): LeadFlowVapiService {
  return new LeadFlowVapiService({
    apiKey: process.env.VAPI_API_KEY!,
    assistantId: process.env.VAPI_ASSISTANT_ID!,
    phoneNumber: process.env.VAPI_PHONE_NUMBER!,
  });
}
```

---

## Phase 3: Workflow Automation (Priority: MEDIUM)

### 3.1 Workflow Engine

```typescript
// leadflow-pro/src/services/workflow/workflowEngine.ts

interface Workflow {
  id: string;
  name: string;
  trigger: 'lead_created' | 'demo_sent' | '48h_followup';
  steps: WorkflowStep[];
}

interface WorkflowStep {
  id: string;
  type: 'email' | 'call' | 'wait' | 'condition';
  config: Record<string, any>;
}

interface WorkflowContext {
  leadId: string;
  leadData: Lead;
  currentStep: number;
  executedSteps: string[];
}

export class WorkflowEngine {
  private workflows: Map<string, Workflow> = new Map();

  // Predefined Workflow Templates
  private workflowTemplates: Workflow[] = [
    {
      id: 'cold_outreach',
      name: 'Cold Outreach Campaign',
      trigger: 'lead_created',
      steps: [
        { id: 'step_1', type: 'email', config: { template: 'lead_intro', delay: 0 } },
        { id: 'step_2', type: 'wait', config: { hours: 48 } },
        { id: 'step_3', type: 'condition', config: { 
          field: 'email_opened', 
          if_true: { type: 'call', config: { script: 'follow_up' } },
          if_false: { type: 'email', config: { template: 'follow_up', delay: 24 } }
        }}
      ]
    },
    {
      id: 'demo_followup',
      name: 'Demo Follow-up',
      trigger: 'demo_sent',
      steps: [
        { id: 'step_1', type: 'wait', config: { hours: 24 } },
        { id: 'step_2', type: 'call', config: { script: 'demo_discussion' } },
      ]
    }
  ];

  async executeWorkflow(workflowId: string, context: WorkflowContext): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return;

    for (const step of workflow.steps) {
      if (step.type === 'wait') {
        await this.wait(step.config.hours);
      } else if (step.type === 'email') {
        await this.sendEmail(context.leadId, step.config.template);
      } else if (step.type === 'call') {
        await this.initiateCall(context.leadId, step.config.script);
      } else if (step.type === 'condition') {
        const shouldContinue = await this.checkCondition(context.leadId, step.config.field);
        if (shouldContinue.if_true) {
          await this.executeStep(context, shouldContinue.if_true);
        }
      }
      
      context.executedSteps.push(step.id);
    }
  }

  private async sendEmail(leadId: string, template: string): Promise<void> {
    // Implementation
  }

  private async initiateCall(leadId: string, script: string): Promise<void> {
    const vapi = createVapiService();
    const lead = await getLeadById(leadId);
    await vapi.initiateColdCall(lead);
  }

  private async wait(hours: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, hours * 60 * 60 * 1000));
  }
}
```

---

## Phase 4: Dashboard Enhancement (Priority: MEDIUM)

### 4.1 Enhanced Analytics Dashboard

```typescript
// leadflow-pro/src/components/analytics/EnhancedAnalytics.tsx

interface AnalyticsData {
  // Overview
  totalLeads: number;
  newLeadsThisWeek: number;
  leadsWithWebsite: number;
  leadsWithoutWebsite: number;
  
  // Scoring
  hotLeads: number; // score >= 70
  warmLeads: number; // score 40-69
  coldLeads: number; // score < 40
  
  // Outreach
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  callsInitiated: number;
  callsCompleted: number;
  
  // Conversion
  demosSent: number;
  interestedLeads: number;
  proposalsSent: number;
  closedWon: number;
  revenue: number;
}

export function EnhancedAnalytics() {
  // Charts:
  // - Leads by Status (pie chart)
  // - Lead Score Distribution (histogram)
  // - Outreach Funnel (bar chart)
  // - Weekly Growth (line chart)
  // - Revenue Over Time (area chart)
  
  return (
    <div className="analytics-grid">
      {/* Overview Cards */}
      <StatCard title="Total Leads" value={data.totalLeads} change="+12%" />
      <StatCard title="Hot Leads" value={data.hotLeads} type="hot" />
      <StatCard title="Conversion Rate" value={`${conversionRate}%`} type="success" />
      <StatCard title="Revenue" value={`CHF ${data.revenue.toLocaleString()}`} type="success" />
      
      {/* Charts */}
      <LeadScoreChart data={leadScores} />
      <OutreachFunnel data={funnelData} />
      <WeeklyGrowthChart data={weeklyData} />
      
      {/* Tables */}
      <TopPerformingLeads leads={topLeads} />
      <RecentActivities activities={activities} />
    </div>
  );
}
```

---

## Phase 5: Export/Import (Priority: LOW)

### 5.1 Export Features

```typescript
// leadflow-pro/src/lib/export/exportService.ts

export async function exportLeads(format: 'csv' | 'xlsx' | 'json'): Promise<Blob> {
  const leads = await getAllLeads();
  
  if (format === 'csv') {
    return generateCSV(leads, [
      'company_name',
      'phone',
      'email',
      'score',
      'status',
      'industry',
      'location',
    ]);
  } else if (format === 'json') {
    return new Blob([JSON.stringify(leads, null, 2)], { type: 'application/json' });
  }
}

export async function importLeads(file: File): Promise<{ success: number; failed: number }> {
  const content = await file.text();
  const leads = parseCSV(content);
  
  let success = 0;
  let failed = 0;
  
  for (const lead of leads) {
    try {
      await createLead(lead);
      success++;
    } catch {
      failed++;
    }
  }
  
  return { success, failed };
}
```

---

## Phase 6: Settings Page (Priority: LOW)

### 6.1 Settings Components

```typescript
// leadflow-pro/src/app/(dashboard)/settings/page.tsx

export default function SettingsPage() {
  return (
    <div className="settings-page">
      {/* Sections */}
      <SettingsSection title="Profile">
        <ProfileSettings />
      </SettingsSection>
      
      <SettingsSection title="Integrations">
        <IntegrationCard name="Supabase" status="connected" />
        <IntegrationCard name="VAPI.ai" status={vapiConfigured ? 'connected' : 'not_configured'} />
        <IntegrationCard name="Resend" status={resendConfigured ? 'connected' : 'not_configured'} />
        <IntegrationCard name="Google Places" status={placesConfigured ? 'connected' : 'not_configured'} />
      </SettingsSection>
      
      <SettingsSection title="Voice Settings">
        <VoiceTemplateSettings />
      </SettingsSection>
      
      <SettingsSection title="Email Templates">
        <EmailTemplateEditor />
      </SettingsSection>
      
      <SettingsSection title="Notifications">
        <NotificationSettings />
      </SettingsSection>
    </div>
  );
}
```

---

## Phase 7: Testing Suite (Priority: MEDIUM)

### 7.1 Test Setup

```typescript
// leadflow-pro/src/__tests__/leads.test.ts

import { describe, it, expect, vi } from 'vitest';
import { getLeads, createLead, updateLeadScore } from '@/lib/db/leads';

describe('Lead Operations', () => {
  it('should create a new lead', async () => {
    const lead = await createLead({
      company_name: 'Test Restaurant',
      phone: '+41791234567',
      industry: 'restaurant',
      location: 'Zürich',
    });
    
    expect(lead.id).toBeDefined();
    expect(lead.score).toBeGreaterThan(0);
  });

  it('should calculate score based on reviews', async () => {
    const lead = await createLead({
      company_name: 'Test Business',
      google_reviews_count: 50,
      google_rating: 4.5,
    });
    
    // 50 * 10 = 500 capped at 20
    // 4.5 * 15 = 67.5 capped at 20
    expect(lead.score).toBe(70); // With website factor
  });
});
```

---

## Implementation Priority Matrix

| Phase | Task | Priority | Effort | Impact |
|-------|------|----------|---------|--------|
| 1 | Enhanced Database Schema | 🔴 HIGH | 2h | 🔴 HIGH |
| 1 | DB Service Layer | 🔴 HIGH | 1h | 🔴 HIGH |
| 2 | VAPI Service | 🔴 HIGH | 2h | 🔴 HIGH |
| 3 | Workflow Engine | 🟡 MEDIUM | 4h | 🟡 MEDIUM |
| 4 | Enhanced Analytics | 🟡 MEDIUM | 3h | 🟡 MEDIUM |
| 5 | Export/Import | 🟢 LOW | 1h | 🟢 LOW |
| 6 | Settings Page | 🟢 LOW | 2h | 🟢 LOW |
| 7 | Testing Suite | 🟡 MEDIUM | 3h | 🟡 MEDIUM |

---

## Total Effort Estimate

| Phase | Hours |
|-------|-------|
| Database Enhancement | 3h |
| VAPI Integration | 2h |
| Workflow Automation | 4h |
| Analytics Enhancement | 3h |
| Export/Import | 1h |
| Settings Page | 2h |
| Testing Suite | 3h |
| **Total** | **18h** |

---

## Files to Create/Modify

### New Files
```
src/lib/db/types.ts
src/lib/db/db-client.ts
src/services/workflow/workflowEngine.ts
src/services/voice/vapi/vapiService.ts
src/components/analytics/EnhancedAnalytics.tsx
src/lib/export/exportService.ts
src/app/(dashboard)/settings/page.tsx
src/__tests__/*.test.ts
```

### Modified Files
```
src/lib/actions/server-actions.ts
src/app/api/leads/route.ts
src/app/api/voice/vapi/route.ts
leadflow-pro/database/schema.sql
```

---

## Next Steps

1. **Immediate**: Create enhanced database schema and DB service layer
2. **Short-term**: Implement VAPI.ai integration
3. **Medium-term**: Build workflow engine
4. **Ongoing**: Enhance analytics and add tests

---

*Plan created: 2026-02-06*
*Author: Bottie AI*
