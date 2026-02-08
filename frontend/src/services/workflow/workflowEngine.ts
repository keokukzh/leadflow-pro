// ============================================
// LeadFlow Pro - Workflow Engine
// ============================================

import { createVapiService } from '@/services/voice/vapi';
import { logActivity, logEmail, getLeadById, updateLead } from '@/lib/db/client';
import { supabase } from '@/lib/db/client';
import type { Lead, ActivityType } from '@/lib/db/types';

// ============================================
// Workflow Definitions
// ============================================

export interface WorkflowStep {
  id: string;
  type: 'email' | 'call' | 'wait' | 'condition' | 'update_status';
  config: WorkflowConfig;
  next_on_success?: string;
  next_on_failure?: string;
}

export interface WorkflowConfig {
  // Email config
  template?: string;
  subject?: string;
  
  // Call config
  script?: string;
  
  // Wait config
  hours?: number;
  days?: number;
  
  // Condition config
  field?: string;
  operator?: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'exists';
  value?: any;
  
  // Update config
  new_status?: string;
  
  // Common
  description?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  enabled: boolean;
  created_at: string;
}

export type WorkflowTrigger = 
  | 'manual'
  | 'lead_created'
  | 'email_opened'
  | 'email_clicked'
  | 'call_completed'
  | 'demo_sent'
  | '48h_followup';

// Predefined Workflow Templates
export const WORKFLOW_TEMPLATES: Workflow[] = [
  {
    id: 'cold_outreach',
    name: 'Cold Outreach Campaign',
    description: 'Full cold outreach sequence: Intro email → 48h wait → Follow-up',
    trigger: 'lead_created',
    enabled: true,
    created_at: new Date().toISOString(),
    steps: [
      {
        id: 'step_1',
        type: 'email',
        config: {
          template: 'lead_intro',
          subject: '🎁 Kostenlose Website-Vorschau für {{company_name}}',
          description: 'Send intro email',
        },
        next_on_success: 'step_2',
      },
      {
        id: 'step_2',
        type: 'wait',
        config: {
          hours: 48,
          description: 'Wait 48 hours',
        },
        next_on_success: 'step_3',
      },
      {
        id: 'step_3',
        type: 'condition',
        config: {
          field: 'email_opened',
          operator: 'exists',
          description: 'Check if email was opened',
        },
        next_on_success: 'step_4',
        next_on_failure: 'step_5',
      },
      {
        id: 'step_4',
        type: 'call',
        config: {
          script: 'follow_up',
          description: 'Call - email was opened',
        },
      },
      {
        id: 'step_5',
        type: 'email',
        config: {
          template: 'follow_up',
          subject: '📞 Haben Sie die Vorschau gesehen?',
          description: 'Send follow-up email',
        },
      },
    ],
  },
  {
    id: 'demo_followup',
    name: 'Demo Follow-up',
    description: 'After demo sent: Wait 24h → Call to discuss',
    trigger: 'demo_sent',
    enabled: true,
    created_at: new Date().toISOString(),
    steps: [
      {
        id: 'step_1',
        type: 'wait',
        config: {
          hours: 24,
          description: 'Wait 24 hours',
        },
        next_on_success: 'step_2',
      },
      {
        id: 'step_2',
        type: 'call',
        config: {
          script: 'demo_discussion',
          description: 'Call to discuss demo',
        },
      },
    ],
  },
  {
    id: 'qualified_leads',
    name: 'Qualified Lead Nurture',
    description: 'For leads with score >= 70: Immediate call + priority follow-up',
    trigger: 'lead_created',
    enabled: false, // Manual trigger only
    created_at: new Date().toISOString(),
    steps: [
      {
        id: 'step_1',
        type: 'call',
        config: {
          script: 'cold_call',
          description: 'Immediate call for hot leads',
        },
        next_on_success: 'step_2',
      },
      {
        id: 'step_2',
        type: 'update_status',
        config: {
          new_status: 'CONTACTED',
          description: 'Mark as contacted',
        },
      },
    ],
  },
  {
    id: 're_engagement',
    name: 'Re-engagement Campaign',
    description: 'For cold leads: Try different approach after 7 days',
    trigger: '48h_followup',
    enabled: true,
    created_at: new Date().toISOString(),
    steps: [
      {
        id: 'step_1',
        type: 'wait',
        config: {
          days: 7,
          description: 'Wait 7 days',
        },
        next_on_success: 'step_2',
      },
      {
        id: 'step_2',
        type: 'email',
        config: {
          template: 'follow_up',
          subject: 'Neu: Website für {{company_name}}',
          description: 'Re-engagement email',
        },
        next_on_success: 'step_3',
      },
      {
        id: 'step_3',
        type: 'wait',
        config: {
          days: 3,
          description: 'Wait 3 days',
        },
        next_on_success: 'step_4',
      },
      {
        id: 'step_4',
        type: 'call',
        config: {
          script: 'closing',
          description: 'Final attempt call',
        },
      },
    ],
  },
];

// ============================================
// Workflow Engine
// ============================================

export class WorkflowEngine {
  private workflows: Map<string, Workflow> = new Map();
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    // Load predefined templates
    WORKFLOW_TEMPLATES.forEach(w => this.workflows.set(w.id, w));
  }

  /**
   * Execute a workflow for a lead
   */
  async executeWorkflow(workflowId: string, leadId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      console.error(`❌ Workflow not found: ${workflowId}`);
      return;
    }

    if (!workflow.enabled) {
      console.log(`⚠️ Workflow disabled: ${workflowId}`);
      return;
    }

    console.log(`🚀 Executing workflow: ${workflow.name} for lead: ${leadId}`);
    
    // Get lead data
    const lead = await getLeadById(leadId);
    if (!lead) {
      console.error(`❌ Lead not found: ${leadId}`);
      return;
    }

    // Execute first step
    await this.executeStep(workflow, workflow.steps[0], lead);
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    workflow: Workflow, 
    step: WorkflowStep, 
    lead: Lead
  ): Promise<void> {
    console.log(`📋 Executing step: ${step.config.description}`);

    try {
      switch (step.type) {
        case 'email':
          await this.sendEmail(lead, step.config);
          break;
        case 'call':
          await this.initiateCall(lead, step.config);
          break;
        case 'wait':
          await this.scheduleWait(workflow, step, lead);
          return; // Don't continue immediately
        case 'condition':
          await this.evaluateCondition(workflow, step, lead);
          return;
        case 'update_status':
          await this.updateLeadStatus(lead.id, step.config.new_status!);
          break;
      }

      // Continue to next step
      if (step.next_on_success) {
        const nextStep = workflow.steps.find(s => s.id === step.next_on_success);
        if (nextStep) {
          setTimeout(() => {
            this.executeStep(workflow, nextStep, lead);
          }, 1000); // Small delay
        }
      }
    } catch (error) {
      console.error(`❌ Step execution failed: ${step.id}`, error);
      
      // Continue to failure path if defined
      if (step.next_on_failure) {
        const failStep = workflow.steps.find(s => s.id === step.next_on_failure);
        if (failStep) {
          this.executeStep(workflow, failStep, lead);
        }
      }
    }
  }

  /**
   * Send email
   */
  private async sendEmail(lead: Lead, config: WorkflowConfig): Promise<void> {
    if (!lead.email) {
      console.log(`⚠️ Lead has no email: ${lead.id}`);
      return;
    }

    // Call email API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId: lead.id,
        template: config.template,
        to: lead.email,
        subject: config.subject?.replace('{{company_name}}', lead.company_name),
      }),
    });

    if (!response.ok) {
      throw new Error('Email sending failed');
    }

    await logEmail({
      lead_id: lead.id,
      template: config.template as any,
      email: lead.email,
      subject: config.subject,
      status: 'sent',
    });

    console.log(`📧 Email sent: ${lead.email}`);
  }

  /**
   * Initiate call
   */
  private async initiateCall(lead: Lead, config: WorkflowConfig): Promise<void> {
    if (!lead.phone) {
      console.log(`⚠️ Lead has no phone: ${lead.id}`);
      return;
    }

    const vapi = createVapiService();
    const result = await vapi.initiateColdCall(lead);

    if (!result.success) {
      throw new Error(`Call failed: ${result.error}`);
    }

    console.log(`📞 Call initiated: ${result.callId}`);
  }

  /**
   * Schedule a wait period
   */
  private async scheduleWait(
    workflow: Workflow, 
    step: WorkflowStep, 
    lead: Lead
  ): Promise<void> {
    const delayMs = (step.config.hours || step.config.days! * 24) * 60 * 60 * 1000;
    
    console.log(`⏰ Scheduling wait: ${delayMs / 1000 / 60 / 60} hours`);

    // In production, use a job queue (Bull, Agenda, etc.)
    // For now, we use setTimeout (note: not persistent across restarts)
    const timeoutId = setTimeout(async () => {
      const nextStep = workflow.steps.find(s => s.id === step.next_on_success);
      if (nextStep) {
        const updatedLead = await getLeadById(lead.id);
        if (updatedLead) {
          await this.executeStep(workflow, nextStep, updatedLead);
        }
      }
    }, delayMs);

    // Store for potential cancellation
    this.scheduledJobs.set(`${workflow.id}_${lead.id}_${step.id}`, timeoutId);
  }

  /**
   * Evaluate a condition
   */
  private async evaluateCondition(
    workflow: Workflow,
    step: WorkflowStep,
    lead: Lead
  ): Promise<void> {
    const field = step.config.field!;
    const operator = step.config.operator!;
    const expectedValue = step.config.value;

    // Get actual value from lead or related records
    let actualValue: any;
    
    if (field === 'email_opened') {
      const { data } = await supabase
        .from('email_logs')
        .select('opened_at')
        .eq('lead_id', lead.id)
        .not('opened_at', 'is', null)
        .single();
      actualValue = !!data?.opened_at;
    } else if (field === 'email_clicked') {
      const { data } = await supabase
        .from('email_logs')
        .select('clicked_at')
        .eq('lead_id', lead.id)
        .not('clicked_at', 'is', null)
        .single();
      actualValue = !!data?.clicked_at;
    } else {
      actualValue = (lead as any)[field];
    }

    // Evaluate condition
    let result = false;
    switch (operator) {
      case 'exists':
        result = !!actualValue;
        break;
      case 'equals':
        result = actualValue === expectedValue;
        break;
      case 'not_equals':
        result = actualValue !== expectedValue;
        break;
      case 'greater_than':
        result = actualValue > expectedValue;
        break;
      case 'less_than':
        result = actualValue < expectedValue;
        break;
    }

    console.log(`🔍 Condition: ${field} ${operator} ${expectedValue} = ${result}`);

    // Continue to appropriate next step
    const nextStepId = result ? step.next_on_success : step.next_on_failure;
    if (nextStepId) {
      const nextStep = workflow.steps.find(s => s.id === nextStepId);
      if (nextStep) {
        await this.executeStep(workflow, nextStep, lead);
      }
    }
  }

  /**
   * Update lead status
   */
  private async updateLeadStatus(leadId: string, newStatus: string): Promise<void> {
    await updateLead(leadId, { status: newStatus as any });
    
    await logActivity({
      lead_id: leadId,
      type: 'status_change',
      description: `Status updated to ${newStatus}`,
      metadata: { new_status: newStatus },
    });

    console.log(`✅ Lead ${leadId} status → ${newStatus}`);
  }

  // ============================================
  // Workflow Management
  // ============================================

  getWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  getWorkflow(id: string): Workflow | undefined {
    return this.workflows.get(id);
  }

  createWorkflow(workflow: Omit<Workflow, 'created_at'>): Workflow {
    const newWorkflow: Workflow = {
      ...workflow,
      created_at: new Date().toISOString(),
    };
    this.workflows.set(newWorkflow.id, newWorkflow);
    return newWorkflow;
  }

  updateWorkflow(id: string, updates: Partial<Workflow>): Workflow | undefined {
    const workflow = this.workflows.get(id);
    if (!workflow) return undefined;
    
    const updated = { ...workflow, ...updates };
    this.workflows.set(id, updated);
    return updated;
  }

  deleteWorkflow(id: string): boolean {
    return this.workflows.delete(id);
  }

  /**
   * Trigger workflow by event
   */
  async onEvent(event: WorkflowTrigger, leadId: string): Promise<void> {
    const workflows = Array.from(this.workflows.values())
      .filter(w => w.trigger === event && w.enabled);

    for (const workflow of workflows) {
      await this.executeWorkflow(workflow.id, leadId);
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

let workflowEngine: WorkflowEngine | null = null;

export function getWorkflowEngine(): WorkflowEngine {
  if (!workflowEngine) {
    workflowEngine = new WorkflowEngine();
  }
  return workflowEngine;
}
