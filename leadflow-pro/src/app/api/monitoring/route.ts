// ============================================
// LeadFlow Pro - Workflow Monitoring API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ============================================================================
// PRODUCTION NOTES:
// - Replace in-memory storage with Redis (Upstash/Redis) or PostgreSQL
// - Add authentication middleware (NextAuth.js or Clerk)
// - Add rate limiting (@upstash/ratelimit)
// ============================================================================

// In-memory store for demo (use database in production)
const executions: Map<string, ExecutionRecord> = new Map();
const metrics: Map<string, MetricPoint> = new Map();

// Validation Schemas
const StartExecutionSchema = z.object({
  workflowId: z.string().min(1, 'Workflow ID required'),
  workflowName: z.string().min(1, 'Workflow name required'),
});

const EventSchema = z.object({
  executionId: z.string().min(1, 'Execution ID required'),
  stepId: z.string().optional(),
  stepName: z.string().optional(),
  type: z.enum(['started', 'progress', 'completed', 'failed']),
  message: z.string().optional(),
  progress: z.number().min(0).max(100),
});

const CompleteSchema = z.object({
  executionId: z.string().min(1, 'Execution ID required'),
  status: z.enum(['completed', 'failed']),
  output: z.record(z.unknown()).optional(),
  error: z.string().optional(),
});

interface ExecutionRecord {
  id: string;
  workflowId: string;
  workflowName: string;
  status: string;
  startTime: Date;
  endTime?: Date;
  steps: StepRecord[];
}

interface StepRecord {
  id: string;
  name: string;
  status: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  retryCount?: number;
  error?: string;
}

interface MetricPoint {
  timestamp: Date;
  executions: number;
  success: number;
  failed: number;
  avgDuration: number;
}

// Constants
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// GET /api/monitoring
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'executions';

  // Add authentication check here in production
  // const session = await auth();
  // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  switch (type) {
    case 'metrics':
      return handleGetMetrics();
    case 'executions':
      return handleGetExecutions(searchParams);
    case 'execution':
      return handleGetExecution(searchParams.get('id'));
    default:
      return NextResponse.json(
        { error: `Unknown type: ${type}` },
        { status: 400 }
      );
  }
}

// POST /api/monitoring
export async function POST(request: NextRequest) {
  // Add authentication check here in production
  // const session = await auth();
  // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'start':
      return handleStartExecution(await request.json());
    case 'event':
      return handleEvent(await request.json());
    case 'complete':
      return handleComplete(await request.json());
    case 'cancel':
      return handleCancel(searchParams.get('id'));
    default:
      return NextResponse.json(
        { error: `Unknown action: ${action}` },
        { status: 400 }
      );
  }
}

function handleGetMetrics() {
  const now = new Date();
  const today = now.toDateString();
  
  const todayMetrics = Array.from(metrics.values())
    .filter(m => m.timestamp.toDateString() === today);

  const totalExecutions = executions.size;
  const successful = Array.from(executions.values())
    .filter(e => e.status === 'completed').length;
  const failed = Array.from(executions.values())
    .filter(e => e.status === 'failed').length;

  const durations = Array.from(executions.values())
    .filter(e => e.endTime)
    .map(e => (e.endTime!.getTime() - e.startTime.getTime()) / 1000);
  
  const avgDuration = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;

  return NextResponse.json({
    success: true,
    metrics: {
      totalExecutions,
      successfulExecutions: successful,
      failedExecutions: failed,
      averageDuration: Math.round(avgDuration),
      successRate: totalExecutions > 0 
        ? Math.round((successful / totalExecutions) * 100) 
        : 0,
      executionsToday: todayMetrics.length,
      recentTrend: todayMetrics.slice(-24), // Last 24 hours
    },
  });
}

function handleGetExecutions(params: URLSearchParams) {
  const limitRaw = parseInt(params.get('limit') || String(DEFAULT_LIMIT));
  const limit = Math.min(Math.max(limitRaw, 1), MAX_LIMIT);
  const workflowId = params.get('workflowId');
  const status = params.get('status');

  let results = Array.from(executions.values());

  if (workflowId) {
    results = results.filter(e => e.workflowId === workflowId);
  }

  if (status) {
    results = results.filter(e => e.status === status);
  }

  results.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  results = results.slice(0, limit);

  return NextResponse.json({
    success: true,
    executions: results.map(e => ({
      id: e.id,
      workflowId: e.workflowId,
      workflowName: e.workflowName,
      status: e.status,
      startTime: e.startTime.toISOString(),
      endTime: e.endTime?.toISOString(),
      duration: e.endTime 
        ? Math.round((e.endTime.getTime() - e.startTime.getTime()) / 1000)
        : undefined,
      stepsCompleted: e.steps.filter(s => s.status === 'completed').length,
      totalSteps: e.steps.length,
    })),
  });
}

function handleGetExecution(id: string | null) {
  if (!id) {
    return NextResponse.json(
      { error: 'Execution ID required' },
      { status: 400 }
    );
  }

  const execution = executions.get(id);
  
  if (!execution) {
    return NextResponse.json(
      { error: 'Execution not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    execution: {
      ...execution,
      startTime: execution.startTime.toISOString(),
      endTime: execution.endTime?.toISOString(),
      steps: execution.steps.map(s => ({
        ...s,
        startTime: s.startTime.toISOString(),
        endTime: s.endTime?.toISOString(),
      })),
    },
  });
}

async function handleStartExecution(data: unknown) {
  // Validate input
  const validated = StartExecutionSchema.safeParse(data);
  
  if (!validated.success) {
    return NextResponse.json(
      { error: 'Invalid request data', details: validated.error.errors },
      { status: 400 }
    );
  }

  const { workflowId, workflowName } = validated.data;
  const id = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const execution: ExecutionRecord = {
    id,
    workflowId,
    workflowName,
    status: 'running',
    startTime: new Date(),
    steps: [],
  };

  executions.set(id, execution);

  // Record metric
  const today = new Date().toDateString();
  const metric = metrics.get(today) || {
    timestamp: new Date(),
    executions: 0,
    success: 0,
    failed: 0,
    avgDuration: 0,
  };
  metric.executions++;
  metrics.set(today, metric);

  return NextResponse.json({
    success: true,
    execution: {
      id,
      workflowId,
      status: 'running',
      startTime: execution.startTime.toISOString(),
    },
  });
}

async function handleEvent(data: unknown) {
  // Validate input
  const validated = EventSchema.safeParse(data);
  
  if (!validated.success) {
    return NextResponse.json(
      { error: 'Invalid event data', details: validated.error.errors },
      { status: 400 }
    );
  }

  const { executionId, stepId, stepName, type, message, progress } = validated.data;
  
  const execution = executions.get(executionId);
  
  if (!execution) {
    return NextResponse.json(
      { error: 'Execution not found' },
      { status: 404 }
    );
  }

  if (stepId) {
    let step = execution.steps.find(s => s.id === stepId);
    
    if (!step) {
      step = {
        id: stepId,
        name: stepName || 'Unknown',
        status: 'running',
        startTime: new Date(),
        retryCount: 0,
      };
      execution.steps.push(step);
    }

    if (type === 'started') {
      step.status = 'running';
      step.startTime = new Date();
    } else if (type === 'completed') {
      step.status = 'completed';
      step.endTime = new Date();
      step.duration = Math.round(
        (step.endTime.getTime() - step.startTime.getTime()) / 1000
      );
    } else if (type === 'failed') {
      step.status = 'failed';
      step.endTime = new Date();
      step.error = message;
    }
  }

  return NextResponse.json({
    success: true,
    event: { executionId, stepId, type, progress },
  });
}

async function handleComplete(data: unknown) {
  // Validate input
  const validated = CompleteSchema.safeParse(data);
  
  if (!validated.success) {
    return NextResponse.json(
      { error: 'Invalid complete data', details: validated.error.errors },
      { status: 400 }
    );
  }

  const { executionId, status, output, error } = validated.data;
  
  const execution = executions.get(executionId);
  
  if (!execution) {
    return NextResponse.json(
      { error: 'Execution not found' },
      { status: 404 }
    );
  }

  execution.status = status;
  execution.endTime = new Date();
  execution.duration = Math.round(
    (execution.endTime.getTime() - execution.startTime.getTime()) / 1000
  );

  // Update metrics with null check
  const today = new Date().toDateString();
  const metric = metrics.get(today);
  
  if (metric) {
    if (status === 'completed') {
      metric.success++;
      
      // Update average duration
      const durations = Array.from(executions.values())
        .filter(e => e.endTime && e.status === 'completed')
        .map(e => (e.endTime!.getTime() - e.startTime.getTime()) / 1000);
      
      metric.avgDuration = durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;
    } else {
      metric.failed++;
    }
    metrics.set(today, metric);
  }

  return NextResponse.json({
    success: true,
    execution: {
      id: execution.id,
      status: execution.status,
      endTime: execution.endTime.toISOString(),
      duration: execution.duration,
    },
  });
}

async function handleCancel(id: string | null) {
  if (!id) {
    return NextResponse.json(
      { error: 'Execution ID required' },
      { status: 400 }
    );
  }

  const execution = executions.get(id);
  
  if (!execution) {
    return NextResponse.json(
      { error: 'Execution not found' },
      { status: 404 }
    );
  }

  execution.status = 'cancelled';
  execution.endTime = new Date();

  return NextResponse.json({
    success: true,
    message: 'Execution cancelled',
  });
}
