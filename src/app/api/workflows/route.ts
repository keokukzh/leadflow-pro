// ============================================
// LeadFlow Pro - Workflow API Route
// GET /api/workflows
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getWorkflowEngine, WORKFLOW_TEMPLATES } from '@/services/workflow/workflowEngine';

export async function GET(request: NextRequest) {
  try {
    const engine = getWorkflowEngine();
    const workflows = engine.getWorkflows();
    
    // Also include templates as available
    const availableTemplates = WORKFLOW_TEMPLATES.map(w => ({
      id: w.id,
      name: w.name,
      description: w.description,
      trigger: w.trigger,
      steps_count: w.steps.length,
    }));

    return NextResponse.json({
      success: true,
      active_workflows: workflows.filter(w => w.enabled).length,
      workflows: workflows.map(w => ({
        id: w.id,
        name: w.name,
        enabled: w.enabled,
        steps: w.steps.map(s => ({
          id: s.id,
          type: s.type,
          description: s.config.description,
        })),
      })),
      templates: availableTemplates,
    });
  } catch (error) {
    console.error('❌ Workflow GET error:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, workflowId, leadId } = body;

    const engine = getWorkflowEngine();

    switch (action) {
      case 'execute':
        if (!workflowId || !leadId) {
          return NextResponse.json({
            success: false,
            error: 'Missing workflowId or leadId',
          }, { status: 400 });
        }
        
        await engine.executeWorkflow(workflowId, leadId);
        
        return NextResponse.json({
          success: true,
          message: `Workflow ${workflowId} started for lead ${leadId}`,
        });

      case 'create':
        const newWorkflow = engine.createWorkflow(body.workflow);
        return NextResponse.json({
          success: true,
          workflow: newWorkflow,
        });

      case 'update':
        const updated = engine.updateWorkflow(workflowId, body.updates);
        return NextResponse.json({
          success: !!updated,
          workflow: updated,
        });

      case 'delete':
        const deleted = engine.deleteWorkflow(workflowId);
        return NextResponse.json({
          success: deleted,
          message: deleted ? 'Workflow deleted' : 'Workflow not found',
        });

      case 'trigger':
        // Trigger workflows by event
        const { event } = body;
        await engine.onEvent(event, leadId);
        return NextResponse.json({
          success: true,
          message: `Triggered workflows for event: ${event}`,
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`,
        }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ Workflow POST error:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}
