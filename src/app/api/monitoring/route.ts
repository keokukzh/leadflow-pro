// ============================================
// LeadFlow Pro - Workflow Monitoring API
// ============================================

import { NextRequest, NextResponse } from 'next/server';

// In-memory store for demo (use database in production)
const executions: Map<string, ExecutionRecord> = new Map();
const metrics: Map<string, MetricPoint> = new Map();

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
}

interface MetricPoint {
  timestamp: Date;
  executions: number;
  success: number;
  failed: number;
  avgDuration: number;
}

// GET /api/monitoring
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'executions';

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
  const limit = parseInt(params.get('limit') || '20');
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

async function handleStartExecution(data: {
  workflowId: string;
  workflowName: string;
}) {
  const id = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const execution: ExecutionRecord = {
    id,
    workflowId: data.workflowId,
    workflowName: data.workflowName,
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
      workflowId: data.workflowId,
      status: 'running',
      startTime: execution.startTime.toISOString(),
    },
  });
}

async function handleEvent(data: {
  executionId: string;
  stepId?: string;
  stepName?: string;
  type: 'started' | 'progress' | 'completed' | 'failed';
  message?: string;
  progress: number;
}) {
  const execution = executions.get(data.executionId);
  
  if (!execution) {
    return NextResponse.json(
      { error: 'Execution not found' },
      { status: 404 }
    );
  }

  if (data.stepId) {
    let step = execution.steps.find(s => s.id === data.stepId);
    
    if (!step) {
      step = {
        id: data.stepId,
        name: data.stepName || 'Unknown',
        status: 'running',
        startTime: new Date(),
        retryCount: 0,
      };
      execution.steps.push(step);
    }

    if (data.type === 'started') {
      step.status = 'running';
      step.startTime = new Date();
    } else if (data.type === 'completed') {
      step.status = 'completed';
      step.endTime = new Date();
      step.duration = Math.round(
        (step.endTime.getTime() - step.startTime.getTime()) / 1000
      );
    } else if (data.type === 'failed') {
      step.status = 'failed';
      step.endTime = new Date();
      step.error = data.message;
    }
  }

  return NextResponse.json({
    success: true,
    event: data,
  });
}

async function handleComplete(data: {
  executionId: string;
  status: 'completed' | 'failed';
  output?: Record<string, unknown>;
  error?: string;
}) {
  const execution = executions.get(data.executionId);
  
  if (!execution) {
    return NextResponse.json(
      { error: 'Execution not found' },
      { status: 404 }
    );
  }

  execution.status = data.status;
  execution.endTime = new Date();
  execution.duration = Math.round(
    (execution.endTime.getTime() - execution.startTime.getTime()) / 1000
  );

  // Update metrics
  const today = new Date().toDateString();
  const metric = metrics.get(today)!;
  
  if (data.status === 'completed') {
    metric.success++;
    
    // Update average duration
    const durations = Array.from(executions.values())
      .filter(e => e.endTime && e.status === 'completed')
      .map(e => (e.endTime!.getTime() - e.startTime.getTime()) / 1000);
    
    metric.avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  } else {
    metric.failed++;
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
