export type TriggerType = 'manual' | 'schedule' | 'webhook' | 'file_change';

export interface TriggerConfig {
  schedule?: string;
  files?: string[];
  webhook?: string;
}

export interface RetryConfig {
  attempts: number;
  delay: number;
}

export interface TaskConfig {
  id: string;
  name: string;
  type: string;
  command?: string;
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  data?: unknown;
  auth?: unknown;
  depends_on?: string[];
  parallel?: boolean;
  timeout?: number;
  retry?: RetryConfig;
  condition?: string;
  on_success?: string[];
  on_failure?: string[];
  cwd?: string;
  environment?: Record<string, string>;
  live_output?: boolean;
}

export interface WorkflowConfig {
  name: string;
  version: string;
  description: string;
  trigger: {
    type: TriggerType;
    config: TriggerConfig;
  };
  environment: Record<string, string>;
  tasks: TaskConfig[];
  notifications?: {
    channels: string[];
    on_completion: boolean;
    on_failure: boolean;
  };
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface TaskExecution {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: TaskStatus;
  result?: unknown;
  error?: string;
}

export interface ExecutionReport {
  id: string;
  workflow: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: 'completed' | 'failed';
  tasks: Record<string, TaskExecution>;
}
