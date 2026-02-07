# LeadFlow Pro - Logic Engine Optimization Plan

## Executive Summary

**Goal:** Transform the basic Workflow Builder into a powerful, visual Logic Engine with real-time monitoring, drag-and-drop capabilities, and intelligent automation.

---

## Current State Analysis

### What Exists

| Component | Status | Quality |
|-----------|--------|---------|
| `orchestrator.ts` | ✅ Working | Good core logic |
| `workflowEngine.ts` | ✅ Working | Basic templates |
| `WorkflowBuilder.tsx` | ⚠️ Basic | Simple template selection |
| `runners.ts` | ✅ Working | Shell, HTTP, JS runners |

### What's Missing

| Feature | Priority | Impact |
|---------|----------|---------|
| Visual Workflow Editor | 🔴 HIGH | UX |
| Real-time Monitoring | 🔴 HIGH | Observability |
| Drag & Drop | 🟡 MEDIUM | UX |
| Template Library | 🔴 HIGH | Reusability |
| Scheduling/Cron | 🟡 MEDIUM | Automation |
| Error Recovery | 🟡 MEDIUM | Reliability |
| Analytics Dashboard | 🟡 MEDIUM | Insights |

---

## Optimization Roadmap

### Phase 1: Visual Workflow Editor (Week 1)

#### 1.1 Drag-and-Drop Canvas

```typescript
// components/workflow/WorkflowCanvas.tsx
"use client";

import { useCallback, useState, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface WorkflowCanvasProps {
  workflowId: string;
  onSave: (nodes: Node[], edges: Edge[]) => void;
}

export function WorkflowCanvas({ workflowId, onSave }: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Task nodes
  const taskNodes: Node[] = useMemo(() => [
    {
      id: 'task-1',
      type: 'task',
      position: { x: 100, y: 100 },
      data: { label: 'Send Email', type: 'email' },
    },
    {
      id: 'task-2',
      type: 'task',
      position: { x: 100, y: 250 },
      data: { label: 'Wait 48h', type: 'wait' },
    },
  ], []);

  return (
    <div className="h-[600px] bg-slate-950 rounded-xl overflow-hidden">
      <ReactFlow
        nodes={[...nodes, ...taskNodes]}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
```

#### 1.2 Custom Task Nodes

```typescript
// components/workflow/TaskNode.tsx
import { Handle, Position, NodeProps } from '@xyflow/react';

export function TaskNode({ data, selected }: NodeProps<TaskNode>) {
  const icons = {
    email: '📧',
    call: '📞',
    wait: '⏰',
    condition: '🔀',
    webhook: '🔗',
    notification: '🔔',
  };

  return (
    <div className={`
      px-4 py-3 rounded-lg border-2 min-w-[180px]
      ${selected ? 'border-primary bg-primary/10' : 'border-slate-700 bg-slate-900'}
    `}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2">
        <span className="text-xl">{icons[data.type as keyof typeof icons] || '📋'}</span>
        <span className="font-medium">{data.label}</span>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
```

#### 1.3 Node Types Registry

```typescript
// components/workflow/nodeTypes.ts
import { NodeTypes } from '@xyflow/react';
import { TaskNode } from './TaskNode';
import { ConditionNode } from './ConditionNode';
import { EmailNode } from './EmailNode';
import { CallNode } from './CallNode';
import { WebhookNode } from './WebhookNode';

export const nodeTypes: NodeTypes = {
  task: TaskNode,
  condition: ConditionNode,
  email: EmailNode,
  call: CallNode,
  webhook: WebhookNode,
};

export const nodeIcons = {
  task: '📋',
  condition: '🔀',
  email: '📧',
  call: '📞',
  wait: '⏰',
  webhook: '🔗',
  notification: '🔔',
  database: '🗄️',
  api: '🌐',
};
```

---

### Phase 2: Real-time Monitoring Dashboard (Week 2)

#### 2.1 Execution Monitor Component

```typescript
// components/monitoring/ExecutionMonitor.tsx
"use client";

import { useState, useEffect } from 'react';
import { useEventSource } from '@/lib/hooks/useEventSource';

interface ExecutionEvent {
  type: 'started' | 'progress' | 'completed' | 'failed';
  taskId: string;
  taskName: string;
  message: string;
  progress: number;
  timestamp: string;
  data?: Record<string, unknown>;
}

export function ExecutionMonitor({ executionId }: { executionId: string }) {
  const [events, setEvents] = useState<ExecutionEvent[]>([]);
  const [status, setStatus] = useState<'running' | 'completed' | 'failed'>('running');

  const { lastEvent, connect, disconnect } = useEventSource(
    `/api/monitoring/executions/${executionId}/stream`
  );

  useEffect(() => {
    if (lastEvent) {
      const event = JSON.parse(lastEvent) as ExecutionEvent;
      setEvents((prev) => [event, ...prev]);
      
      if (event.type === 'completed') setStatus('completed');
      if (event.type === 'failed') setStatus('failed');
    }
  }, [lastEvent]);

  return (
    <div className="bg-slate-950 rounded-xl p-6">
      {/* Status Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className={`
          w-4 h-4 rounded-full animate-pulse
          ${status === 'running' ? 'bg-green-500' : ''}
          ${status === 'completed' ? 'bg-blue-500' : ''}
          ${status === 'failed' ? 'bg-red-500' : ''}
        `} />
        <h3 className="text-lg font-semibold">
          Execution #{executionId.slice(0, 8)}
        </h3>
        <span className="text-slate-400">
          {events.length} events
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-6">
        <div 
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
          style={{ 
            width: `${events.length > 0 
              ? Math.max(...events.map(e => e.progress)) 
              : 0}%` 
          }}
        />
      </div>

      {/* Event Timeline */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {events.map((event, i) => (
          <div 
            key={i}
            className={`
              flex items-start gap-3 p-3 rounded-lg
              ${event.type === 'started' ? 'bg-green-500/10' : ''}
              ${event.type === 'completed' ? 'bg-blue-500/10' : ''}
              ${event.type === 'failed' ? 'bg-red-500/10' : ''}
            `}
          >
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
              ${event.type === 'started' ? 'bg-green-500/20 text-green-400' : ''}
              ${event.type === 'completed' ? 'bg-blue-500/20 text-blue-400' : ''}
              ${event.type === 'failed' ? 'bg-red-500/20 text-red-400' : ''}
            `}>
              {event.type === 'started' && '▶️'}
              {event.type === 'progress' && '⏳'}
              {event.type === 'completed' && '✅'}
              {event.type === 'failed' && '❌'}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium">{event.taskName}</p>
              <p className="text-sm text-slate-400 truncate">{event.message}</p>
            </div>
            
            <div className="text-xs text-slate-500">
              {new Date(event.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 2.2 Live Metrics Dashboard

```typescript
// components/monitoring/MetricsDashboard.tsx
"use client";

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MetricPoint {
  timestamp: string;
  executions: number;
  success: number;
  failed: number;
  avgDuration: number;
}

export function MetricsDashboard() {
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);

  useEffect(() => {
    // Fetch metrics every 30 seconds
    const interval = setInterval(async () => {
      const res = await fetch('/api/monitoring/metrics');
      const data = await res.json();
      setMetrics(data);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Summary Cards */}
      <MetricsCard
        title="Total Executions"
        value={metrics.reduce((a, b) => a + b.executions, 0)}
        change="+12%"
        trend="up"
        icon="🚀"
      />
      <MetricsCard
        title="Success Rate"
        value={`${calculateSuccessRate(metrics)}%`}
        change="+3%"
        trend="up"
        icon="✅"
      />
      <MetricsCard
        title="Avg Duration"
        value={`${calculateAvgDuration(metrics)}s`}
        change="-5%"
        trend="down"
        icon="⏱️"
      />
      <MetricsCard
        title="Active Now"
        value={getActiveExecutions()}
        change="0"
        trend="neutral"
        icon="🔴"
      />

      {/* Charts */}
      <div className="col-span-2 bg-slate-950 rounded-xl p-6">
        <h3 className="font-semibold mb-4">Execution Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={metrics}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                border: '1px solid #334155',
                borderRadius: '8px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="success" 
              stroke="#22c55e" 
              strokeWidth={2}
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="failed" 
              stroke="#ef4444" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Error Distribution */}
      <div className="col-span-2 bg-slate-950 rounded-xl p-6">
        <h3 className="font-semibold mb-4">Error Distribution</h3>
        <ErrorPieChart data={getErrorDistribution(metrics)} />
      </div>
    </div>
  );
}
```

---

### Phase 3: Smart Template Library (Week 3)

#### 3.1 Template Categories

```typescript
// lib/workflow/templates.ts

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  steps: WorkflowStep[];
  estimatedDuration: number; // minutes
  successRate: number; // 0-100
  useCount: number;
  rating: number; // 1-5
  thumbnail?: string;
}

export type TemplateCategory = 
  | 'lead_nurture'
  | 'sales_outreach'
  | 'onboarding'
  | 'support'
  | 'notification'
  | 'data_sync'
  | 'custom';

export const templateLibrary: WorkflowTemplate[] = [
  {
    id: 'cold_outreach_standard',
    name: 'Cold Outreach Standard',
    description: 'Standard cold outreach sequence with email + follow-up',
    category: 'sales_outreach',
    tags: ['email', 'follow-up', 'lead generation'],
    steps: [
      { type: 'email', template: 'cold_intro', delay: 0 },
      { type: 'wait', duration: 48 },
      { type: 'condition', field: 'email_opened' },
      { type: 'call', script: 'follow_up' },
    ],
    estimatedDuration: 72,
    successRate: 23,
    useCount: 1250,
    rating: 4.5,
  },
  {
    id: 'hot_lead_rush',
    name: 'Hot Lead Rush',
    description: 'Immediate action for high-score leads',
    category: 'lead_nurture',
    tags: ['urgent', 'high-priority', 'fast'],
    steps: [
      { type: 'notification', channel: 'slack', priority: 'urgent' },
      { type: 'call', priority: 'immediate' },
      { type: 'email', template: 'hot_lead_alert' },
    ],
    estimatedDuration: 5,
    successRate: 67,
    useCount: 89,
    rating: 4.8,
  },
  {
    id: 'demo_follow_up',
    name: 'Demo Follow-up',
    description: 'Nurture leads after demo presentation',
    category: 'lead_nurture',
    tags: ['demo', 'follow-up', 'sales'],
    steps: [
      { type: 'wait', duration: 24 },
      { type: 'email', template: 'demo_thank_you' },
      { type: 'wait', duration: 72 },
      { type: 'condition', field: 'email_clicked' },
      { type: 'call', script: 'demo_discussion' },
    ],
    estimatedDuration: 120,
    successRate: 34,
    useCount: 456,
    rating: 4.3,
  },
  // ... more templates
];
```

#### 3.2 Template Recommender

```typescript
// services/workflow/templateRecommender.ts

interface LeadContext {
  industry: string;
  leadScore: number;
  previousInteractions: number;
  emailOpened?: boolean;
  websiteVisited?: boolean;
  callCompleted?: boolean;
}

class TemplateRecommender {
  private templates: WorkflowTemplate[];

  async recommend(context: LeadContext): Promise<WorkflowTemplate[]> {
    // Score each template based on context
    const scored = this.templates.map(template => ({
      template,
      score: this.calculateScore(template, context),
    }));

    // Sort by score and return top 3
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.template);
  }

  private calculateScore(template: WorkflowTemplate, context: LeadContext): number {
    let score = 0;

    // Industry match
    if (template.tags.includes(context.industry)) {
      score += 30;
    }

    // Lead score match
    if (context.leadScore >= 70 && template.tags.includes('urgent')) {
      score += 25;
    }

    // Interaction-based scoring
    if (context.emailOpened && template.tags.includes('follow-up')) {
      score += 20;
    }

    // Success rate weight
    score += template.successRate * 0.3;

    // Popularity weight
    score += Math.min(template.useCount / 100, 10);

    return score;
  }
}

export const templateRecommender = new TemplateRecommender();
```

---

### Phase 4: Scheduling & Cron (Week 4)

#### 4.1 Scheduler Service

```typescript
// services/workflow/scheduler.ts

import { CronJob } from 'cron';

interface ScheduledWorkflow {
  id: string;
  workflowId: string;
  cronExpression: string;
  timezone: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  config: {
    maxConcurrent?: number;
    retryPolicy?: {
      maxRetries: number;
      backoffMs: number;
    };
  };
}

export class WorkflowScheduler {
  private jobs: Map<string, CronJob> = new Map();

  async schedule(workflow: ScheduledWorkflow): Promise<void> {
    const job = new CronJob(
      workflow.cronExpression,
      () => this.executeWorkflow(workflow),
      null,
      true,
      workflow.timezone
    );

    this.jobs.set(workflow.id, job);
    
    // Persist to database
    await this.persistSchedule(workflow);
  }

  async executeWorkflow(workflow: ScheduledWorkflow): Promise<void> {
    console.log(`🚀 Starting scheduled workflow: ${workflow.id}`);
    
    try {
      const orchestrator = new WorkflowOrchestrator();
      const config = await this.loadWorkflowConfig(workflow.workflowId);
      
      await orchestrator.execute(config);
      
      // Update last run time
      await this.updateLastRun(workflow.id);
      
    } catch (error) {
      console.error(`❌ Scheduled workflow failed: ${workflow.id}`, error);
      await this.handleFailure(workflow, error);
    }
  }

  async getSchedule(workflowId: string): Promise<ScheduledWorkflow | null> {
    // Load from database
    return null;
  }

  async listSchedules(): Promise<ScheduledWorkflow[]> {
    // Load all schedules
    return [];
  }

  async pauseSchedule(workflowId: string): Promise<void> {
    const job = this.jobs.get(workflowId);
    if (job) {
      job.stop();
    }
  }

  async resumeSchedule(workflowId: string): Promise<void> {
    const schedule = await this.getSchedule(workflowId);
    if (schedule) {
      await this.schedule(schedule);
    }
  }
}

export const workflowScheduler = new WorkflowScheduler();
```

#### 4.2 Schedule Management UI

```typescript
// components/scheduling/ScheduleManager.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

const cronPresets = [
  { label: 'Every Hour', expression: '0 * * * *' },
  { label: 'Every Day at 9AM', expression: '0 9 * * *' },
  { label: 'Every Week', expression: '0 0 * * 0' },
  { label: 'Every Month', expression: '0 0 1 * *' },
];

export function ScheduleManager({ workflowId }: { workflowId: string }) {
  const [cron, setCron] = useState('0 9 * * *');
  const [timezone, setTimezone] = useState('Europe/Zurich');
  const [enabled, setEnabled] = useState(false);

  return (
    <div className="bg-slate-950 rounded-xl p-6 space-y-4">
      <h3 className="font-semibold">Schedule Workflow</h3>

      {/* Cron Expression */}
      <div>
        <label className="block text-sm text-slate-400 mb-2">
          Cron Expression
        </label>
        <div className="flex gap-2">
          <Input
            value={cron}
            onChange={(e) => setCron(e.target.value)}
            className="flex-1 font-mono"
            placeholder="0 9 * * *"
          />
          <Select
            value={cron}
            onChange={(e) => setCron(e.target.value)}
            className="w-48"
          >
            {cronPresets.map((preset) => (
              <option key={preset.expression} value={preset.expression}>
                {preset.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Timezone */}
      <div>
        <label className="block text-sm text-slate-400 mb-2">
          Timezone
        </label>
        <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
          <option value="Europe/Zurich">🇨🇭 Zurich (CET/CEST)</option>
          <option value="Europe/Berlin">🇩🇪 Berlin (CET/CEST)</option>
          <option value="America/New_York">🇺🇸 New York (EST/EDT)</option>
          <option value="Asia/Tokyo">🇯🇵 Tokyo (JST)</option>
        </Select>
      </div>

      {/* Next Run Preview */}
      <div className="bg-slate-900 rounded-lg p-4">
        <p className="text-sm text-slate-400">Next Run</p>
        <p className="text-xl font-mono">
          {formatNextRun(cron, timezone)}
        </p>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">
          {enabled ? '🟢 Schedule is active' : '🔴 Schedule is paused'}
        </span>
        <Button
          variant={enabled ? 'destructive' : 'default'}
          onClick={() => setEnabled(!enabled)}
        >
          {enabled ? 'Pause Schedule' : 'Start Schedule'}
        </Button>
      </div>
    </div>
  );
}

function formatNextRun(cron: string, timezone: string): string {
  // Calculate next run time
  // This would use a library like 'cron-parser'
  return 'Tomorrow at 9:00 AM';
}
```

---

### Phase 5: Error Recovery & Retries (Week 5)

#### 5.1 Retry Policy

```typescript
// lib/workflow/retryPolicy.ts

export interface RetryConfig {
  maxRetries: number;
  backoffMs: number;
  backoffMultiplier: number;
  maxBackoffMs: number;
  retryableStatuses: number[]; // HTTP status codes
  retryableErrors: string[]; // Error messages to retry on
}

export const defaultRetryPolicy: RetryConfig = {
  maxRetries: 3,
  backoffMs: 1000,
  backoffMultiplier: 2,
  maxBackoffMs: 60000,
  retryableStatuses: [429, 500, 502, 503, 504],
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'socket hang up',
    'Service Unavailable',
  ],
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = defaultRetryConfig
): Promise<T> {
  let lastError: Error | null = null;
  let delay = config.backoffMs;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if retryable
      if (!isRetryable(error, config)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === config.maxRetries) {
        throw error;
      }

      console.log(`⚠️ Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await sleep(delay);

      // Exponential backoff with jitter
      delay = Math.min(delay * config.backoffMultiplier, config.maxBackoffMs);
      delay += Math.random() * 100; // Add jitter
    }
  }

  throw lastError;
}

function isRetryable(error: Error, config: RetryConfig): boolean {
  // Check status codes
  if ('status' in error && config.retryableStatuses.includes(error.status)) {
    return true;
  }

  // Check error messages
  return config.retryableErrors.some(
    (msg) => error.message?.includes(msg)
  );
}
```

---

## File Structure

```
src/
├── components/
│   ├── workflow/
│   │   ├── WorkflowCanvas.tsx        # Drag & drop canvas
│   │   ├── TaskNode.tsx             # Custom task nodes
│   │   ├── ConditionNode.tsx        # Condition nodes
│   │   ├── EmailNode.tsx            # Email nodes
│   │   ├── CallNode.tsx             # Call nodes
│   │   ├── nodeTypes.ts             # Node type registry
│   │   └── WorkflowToolbar.tsx      # Toolbar with node palette
│   │
│   ├── monitoring/
│   │   ├── ExecutionMonitor.tsx      # Real-time execution view
│   │   ├── MetricsDashboard.tsx     # Metrics & charts
│   │   ├── ExecutionList.tsx        # List of executions
│   │   └── ExecutionDetail.tsx      # Single execution view
│   │
│   ├── scheduling/
│   │   ├── ScheduleManager.tsx      # Schedule management UI
│   │   ├── CronPicker.tsx           # Cron expression picker
│   │   └── ScheduleList.tsx         # List of schedules
│   │
│   └── templates/
│       ├── TemplateLibrary.tsx     # Template browser
│       ├── TemplateCard.tsx        # Template preview card
│       └── TemplateRecommender.tsx  # AI template suggestions
│
├── lib/
│   ├── workflow/
│   │   ├── orchestrator.ts         # Core orchestrator (existing)
│   │   ├── workflowEngine.ts        # Workflow engine (existing)
│   │   ├── scheduler.ts            # New scheduler
│   │   ├── retryPolicy.ts          # Retry logic
│   │   ├── templates.ts            # Template library
│   │   └── templates/
│   │       ├── cold_outreach.ts
│   │       ├── hot_lead_rush.ts
│   │       └── demo_follow_up.ts
│   │
│   ├── monitoring/
│   │   ├── metrics.ts              # Metrics collection
│   │   ├── alerting.ts             # Alert management
│   │   └── eventBus.ts             # Event streaming
│   │
│   └── hooks/
│       ├── useWorkflow.ts          # Workflow CRUD hooks
│       ├── useExecution.ts          # Execution hooks
│       ├── useEventSource.ts       # SSE hook
│       └── useScheduling.ts        # Scheduling hooks
│
├── app/api/
│   ├── workflow/
│   │   ├── route.ts                # CRUD endpoints
│   │   ├── [id]/route.ts           # Single workflow
│   │   └── execute/route.ts        # Execute workflow
│   │
│   ├── monitoring/
│   │   ├── metrics/route.ts        # GET /metrics
│   │   ├── executions/route.ts      # List executions
│   │   └── [id]/route.ts          # Execution details
│   │
│   └── scheduling/
│       ├── route.ts                # CRUD schedules
│       └── [id]/route.ts           # Single schedule
│
└── types/
    └── workflow.ts                 # All workflow types
```

---

## Implementation Timeline

| Week | Phase | Deliverables |
|------|-------|-------------|
| 1 | Visual Editor | Drag & drop canvas, custom nodes |
| 2 | Monitoring | Real-time execution view, metrics |
| 3 | Templates | Template library, recommender |
| 4 | Scheduling | Cron support, schedule manager |
| 5 | Reliability | Retry policies, error handling |

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Time to create workflow | <5 min | ~20 min |
| Visual editing adoption | 80% | 0% |
| Execution success rate | >95% | ~85% |
| User satisfaction | 4.5/5 | N/A |
| Error recovery time | <5 min | Manual |

---

## Next Steps

1. **Install dependencies:**
```bash
npm install @xyflow/react recharts cron
```

2. **Create basic canvas component**

3. **Add monitoring hooks**

4. **Implement template library**

5. **Test with sample workflows**

---

*Plan created: 2026-02-07*
*Author: Bottie AI 🧠*
