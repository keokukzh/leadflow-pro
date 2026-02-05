import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { WorkflowEngine, WorkflowStatus, TriggerType } from "@/lib/automation/workflow-engine";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Workflow engine singleton
let workflowEngine: WorkflowEngine | null = null;

function getWorkflowEngine(): WorkflowEngine {
  if (!workflowEngine) {
    workflowEngine = new WorkflowEngine();
  }
  return workflowEngine;
}

// ============================================
// WORKFLOW EXECUTION API
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflow_id, lead_id, context } = body;
    
    if (!workflow_id) {
      return NextResponse.json({ error: "workflow_id is required" }, { status: 400 });
    }
    
    const engine = getWorkflowEngine();
    
    // Build context from lead data if not provided
    let executionContext = context || {};
    
    if (lead_id) {
      const { data: lead } = await supabase
        .from("leads")
        .select("*")
        .eq("id", lead_id)
        .single();
      
      if (lead) {
        executionContext = {
          ...executionContext,
          ...lead,
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
    
    // Log execution
    await supabase.from("workflow_logs").insert({
      workflow_id,
      lead_id,
      context: executionContext,
      result,
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
      // Return pre-built templates
      return NextResponse.json({
        templates: engine.get_workflow_templates()
      });
    }
    
    if (action === "list") {
      // List user's workflows
      const { data: workflows } = await supabase
        .from("workflows")
        .select("*")
        .order("created_at", { ascending: false });
      
      return NextResponse.json({ workflows: workflows || [] });
    }
    
    // Default: return workflow stats
    return NextResponse.json({
      status: "active",
      workflows_count: Object.keys(engine._workflows).length,
      executions_today: 0
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
    const { name, trigger, conditions, actions } = body;
    
    if (!name || !trigger) {
      return NextResponse.json({ error: "name and trigger are required" }, { status: 400 });
    }
    
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
        created_at: workflow.created_at.toISOString()
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
