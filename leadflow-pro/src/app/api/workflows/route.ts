import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key";
const supabase = createClient(supabaseUrl, supabaseKey);

// Import workflow engine (will be created in lib/automation)
let workflowEngine: any = null;

function getWorkflowEngine(): any {
  if (!workflowEngine) {
    // Lazy initialization - in real implementation, import from lib
    workflowEngine = {
      _workflows: {},
      create_workflow: (name: string, trigger: string, conditions: any[], actions: any[]) => ({
        id: Math.random().toString(36).substring(7),
        name,
        trigger,
        conditions,
        actions,
        status: "pending"
      }),
      execute_workflow: (workflowId: string, context: any) => ({
        success: true,
        workflow_id: workflowId,
        actions_executed: []
      }),
      get_workflow_templates: () => [
        {
          id: "welcome_new_leads",
          name: "Willkommens-E-Mail",
          trigger: "lead_created",
          actions: [
            { type: "send_email", template_id: "welcome" },
            { type: "create_task", title: "Neuen Lead kontaktieren" }
          ]
        },
        {
          id: "high_value_alert",
          name: "High-Value Alert",
          trigger: "lead_score_changed",
          conditions: [{ field: "calculated_score", operator: "greater_than", value: 80 }],
          actions: [
            { type: "notify_slack", channel: "#sales-leads" }
          ]
        }
      ]
    };
  }
  return workflowEngine;
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

const WorkflowExecutionSchema = z.object({
  workflow_id: z.string().min(1, "workflow_id is required"),
  lead_id: z.string().uuid().optional(),
  context: z.record(z.any()).optional()
});

const CreateWorkflowSchema = z.object({
  name: z.string().min(1).max(100),
  trigger: z.enum(["lead_created", "lead_score_changed", "website_status_changed", "schedule", "manual"]),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(["equals", "not_equals", "greater_than", "less_than", "contains", "not_contains"]),
    value: z.any()
  })).optional(),
  actions: z.array(z.object({
    type: z.enum(["send_email", "create_task", "update_lead", "notify_slack", "webhook", "delay"]),
    template_id: z.string().optional(),
    title: z.string().optional(),
    channel: z.string().optional(),
    delay_hours: z.number().optional()
  })).optional()
});

// ============================================
// WORKFLOW EXECUTION API
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = WorkflowExecutionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { workflow_id, lead_id, context } = validationResult.data;
    const engine = getWorkflowEngine();
    
    // Build context from lead data if not provided
    let executionContext = context || {};
    
    if (lead_id) {
      const { data: lead, error } = await supabase
        .from("leads")
        .select("*")
        .eq("id", lead_id)
        .single();
      
      if (!error && lead) {
        executionContext = {
          ...executionContext,
          lead_id: lead.id,
          company_name: lead.company_name,
          industry: lead.industry,
          location: lead.location,
          website_status: lead.website_status,
          calculated_score: lead.calculated_score,
          rating: lead.rating,
          phone: lead.phone,
          email: lead.email
        };
      }
    }
    
    // Execute workflow
    const result = engine.execute_workflow(workflow_id, executionContext);
    
    // Log execution (sanitized - no sensitive data)
    await supabase.from("workflow_logs").insert({
      workflow_id,
      lead_id: lead_id || null,
      result: { success: result.success },
      executed_at: new Date().toISOString()
    });
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error("Workflow execution error:", error);
    return NextResponse.json({ error: "Workflow execution failed" }, { status: 500 });
  }
}

// ============================================
// WORKFLOW MANAGEMENT API
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const engine = getWorkflowEngine();
    
    if (action === "templates") {
      return NextResponse.json({
        templates: engine.get_workflow_templates()
      });
    }
    
    if (action === "list") {
      const { data: workflows } = await supabase
        .from("workflows")
        .select("*")
        .order("created_at", { ascending: false });
      
      return NextResponse.json({ workflows: workflows || [] });
    }
    
    return NextResponse.json({
      status: "active",
      workflows_count: Object.keys(engine._workflows).length
    });
    
  } catch (error) {
    console.error("Workflow API error:", error);
    return NextResponse.json({ error: "API request failed" }, { status: 500 });
  }
}

// ============================================
// CREATE WORKFLOW API
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = CreateWorkflowSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.errors },
        { status: 400 }
      );
    }
    
    const { name, trigger, conditions, actions } = validationResult.data;
    const engine = getWorkflowEngine();
    
    const workflow = engine.create_workflow(
      name,
      trigger,
      conditions || [],
      actions || []
    );
    
    // Save to database
    const { data, error } = await supabase
      .from("workflows")
      .insert({
        id: workflow.id,
        name: workflow.name,
        trigger: workflow.trigger,
        conditions: workflow.conditions,
        actions: workflow.actions,
        status: workflow.status,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ workflow: data });
    
  } catch (error) {
    console.error("Create workflow error:", error);
    return NextResponse.json({ error: "Failed to create workflow" }, { status: 500 });
  }
}
