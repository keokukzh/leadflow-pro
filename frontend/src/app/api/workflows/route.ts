import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readData, writeData } from "@/lib/storage";
import { WorkflowOrchestrator } from "@/lib/orchestrator/orchestrator";
import { WorkflowConfig, TaskConfig, TriggerType } from "@/lib/orchestrator/types";

const WORKFLOWS_FILE = "workflows.json";
const WORKFLOW_LOGS_FILE = "workflow_logs.json";

// ============================================
// VALIDATION SCHEMAS
// ============================================

const WorkflowExecutionSchema = z.object({
  workflow_id: z.string().min(1, "workflow_id is required"),
  lead_id: z.string().optional(),
  context: z.record(z.unknown()).optional()
});

const CreateWorkflowSchema = z.object({
  name: z.string().min(1).max(100),
  trigger: z.enum(["lead_created", "lead_score_changed", "website_status_changed", "schedule", "manual"]),
  description: z.string().optional(),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(["equals", "not_equals", "greater_than", "less_than", "contains", "not_contains"]),
    value: z.unknown()
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
    const validationResult = WorkflowExecutionSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ error: "Validation failed", details: validationResult.error.errors }, { status: 400 });
    }
    
    const { workflow_id, lead_id, context } = validationResult.data;
    const workflows = await readData<Record<string, unknown>[]>(WORKFLOWS_FILE, []);
    const workflow = workflows.find(w => w.id === workflow_id);
    
    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }
    
    // Map UI actions to Orchestrator tasks
    const tasks: TaskConfig[] = (workflow.actions as Record<string, unknown>[] || []).map((action: any, index: number) => {
      const id = `task_${index}`;
      switch (action.type) {
        case "send_email":
          return { id, name: "Send Email", type: "http", url: "/api/contact/email", method: "POST", data: { template_id: action.template_id, lead_id } };
        case "notify_slack":
          return { id, name: "Notify Slack", type: "http", url: action.webhook || "/api/notifications/slack", method: "POST", data: { channel: action.channel, message: "Workflow Alert" } };
        case "delay":
          return { id, name: "Delay", type: "javascript", command: `await new Promise(r => setTimeout(r, ${action.delay_hours * 3600000}))` };
        default:
          return { id, name: action.type, type: "javascript", command: "console.log('Action executed')" };
      }
    });

    const config: WorkflowConfig = {
      name: (workflow.name as string) || "Unnamed Workflow",
      version: "1.0",
      description: (workflow.description as string) || "",
      trigger: { type: (workflow.trigger as TriggerType) || "manual", config: {} },
      environment: (context as Record<string, string>) || {},
      tasks
    };

    const orchestrator = new WorkflowOrchestrator();
    const report = await orchestrator.execute(config);
    
    // Log execution
    const logs = await readData<Record<string, unknown>[]>(WORKFLOW_LOGS_FILE, []);
    logs.push({
      ...report,
      lead_id,
      workflow_id,
      executed_at: new Date().toISOString()
    });
    await writeData(WORKFLOW_LOGS_FILE, logs);
    
    return NextResponse.json(report);
    
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
    
    if (action === "list") {
      const workflows = await readData<Record<string, unknown>[]>(WORKFLOWS_FILE, []);
      return NextResponse.json({ workflows });
    }
    
    const logs = await readData<Record<string, unknown>[]>(WORKFLOW_LOGS_FILE, []);
    return NextResponse.json({
      status: "active",
      logs_count: logs.length
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
    const validationResult = CreateWorkflowSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ error: "Validation failed", details: validationResult.error.errors }, { status: 400 });
    }
    
    const { name, trigger, conditions, actions, description } = validationResult.data;
    const workflows = await readData<Record<string, unknown>[]>(WORKFLOWS_FILE, []);
    
    const newWorkflow = {
      id: Math.random().toString(36).substring(7),
      name,
      description,
      trigger,
      conditions: conditions || [],
      actions: actions || [],
      status: "active",
      created_at: new Date().toISOString()
    };
    
    workflows.push(newWorkflow);
    await writeData(WORKFLOWS_FILE, workflows);
    
    return NextResponse.json({ workflow: newWorkflow });
    
  } catch (error) {
    console.error("Create workflow error:", error);
    return NextResponse.json({ error: "Failed to create workflow" }, { status: 500 });
  }
}
