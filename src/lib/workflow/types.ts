// ============================================
// LeadFlow Pro - Workflow Types
// ============================================

// Core workflow types
export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  trigger: WorkflowTrigger;
  enabled: boolean;
  config: WorkflowConfig;
  createdAt: string;
  updatedAt: string;
  lastExecuted?: string;
  executionCount: number;
  successRate: number;
}

export interface WorkflowStep {
  id: string;
  type: StepType;
  name: string;
  description?: string;
  config: StepConfig;
  depends_on?: string[]; // Step IDs this depends on
  retry?: RetryConfig;
  timeout?: number; // seconds
}

export type StepType =
  | 'email'
  | 'call'
  | 'wait'
  | 'condition'
  | 'webhook'
  | 'notification'
  | 'database'
  | 'api'
  | 'script'
  | 'branch'
  | 'parallel';

// Trigger types
export type WorkflowTrigger =
  | 'manual'
  | 'schedule'
  | 'webhook'
  | 'event'
  | 'lead_created'
  | 'email_opened'
  | 'demo_sent';

// Configuration
export interface WorkflowConfig {
  maxConcurrent?: number;
  timeout?: number;
  notifications?: NotificationConfig;
  retry?: RetryConfig;
}

export interface NotificationConfig {
  onStart?: boolean;
  onComplete?: boolean;
  onFail?: boolean;
  channels?: ('slack' | 'email' | 'webhook')[];
  webhookUrl?: string;
  email?: string;
}

export interface RetryConfig {
  maxRetries: number;
  backoffMs: number;
  backoffMultiplier?: number;
  maxBackoffMs?: number;
}

// Step configurations
export interface StepConfig {
  // Email step
  template?: string;
  subject?: string;
  to?: string;
  cc?: string;
  bcc?: string;
  attachments?: string[];
  
  // Call step
  phoneNumber?: string;
  script?: string;
  voice?: string;
  
  // Wait step
  duration?: number;
  unit?: 'seconds' | 'minutes' | 'hours' | 'days';
  
  // Condition step
  field?: string;
  operator?: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'exists';
  value?: unknown;
  
  // Webhook step
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  
  // Branch step
  branches?: BranchConfig[];
  
  // Parallel step
  parallel?: string[];
}

export interface BranchConfig {
  name: string;
  condition?: {
    field: string;
    operator: string;
    value: unknown;
  };
  steps: WorkflowStep[];
}

// Template types
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
  author?: string;
  version?: string;
}

export type TemplateCategory =
  | 'lead_nurture'
  | 'sales_outreach'
  | 'onboarding'
  | 'support'
  | 'notification'
  | 'data_sync'
  | 'custom';

// Execution types
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: ExecutionStatus;
  startTime: string;
  endTime?: string;
  duration?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  steps: StepExecution[];
  error?: string;
}

export type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout';

export interface StepExecution {
  stepId: string;
  stepName: string;
  stepType: StepType;
  status: ExecutionStatus;
  startTime?: string;
  endTime?: string;
  duration?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  retryCount: number;
}

// Schedule types
export interface WorkflowSchedule {
  id: string;
  workflowId: string;
  cronExpression: string;
  timezone: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  config: {
    maxConcurrent?: number;
    retryPolicy?: RetryConfig;
  };
}

// Monitoring types
export interface WorkflowMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  executionsToday: number;
  successRate: number;
  byWorkflow: Record<string, WorkflowMetrics>;
}

export interface ExecutionEvent {
  type: 'started' | 'progress' | 'completed' | 'failed' | 'retry';
  executionId: string;
  stepId?: string;
  stepName?: string;
  message: string;
  progress: number;
  timestamp: string;
  data?: Record<string, unknown>;
}
