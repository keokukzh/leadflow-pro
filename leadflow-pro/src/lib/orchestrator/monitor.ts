import { ExecutionReport } from './types';

export interface WorkflowMetrics {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  averageDuration: number;
  taskMetrics: Record<string, {
    runs: number;
    failures: number;
    averageDuration: number;
  }>;
}

export class WorkflowMonitor {
  private metrics: WorkflowMetrics = {
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0,
    averageDuration: 0,
    taskMetrics: {}
  };

  recordExecution(report: ExecutionReport) {
    this.metrics.totalRuns++;
    
    if (report.status === 'completed') {
      this.metrics.successfulRuns++;
    } else {
      this.metrics.failedRuns++;
    }

    // Update average duration
    this.metrics.averageDuration = 
      (this.metrics.averageDuration * (this.metrics.totalRuns - 1) + report.duration) / 
      this.metrics.totalRuns;

    // Record task metrics
    for (const [taskId, task] of Object.entries(report.tasks)) {
      if (!this.metrics.taskMetrics[taskId]) {
        this.metrics.taskMetrics[taskId] = {
          runs: 0,
          failures: 0,
          averageDuration: 0
        };
      }

      const m = this.metrics.taskMetrics[taskId];
      m.runs++;
      
      if (task.status === 'failed') {
        m.failures++;
      }

      if (task.duration) {
        m.averageDuration = 
          (m.averageDuration * (m.runs - 1) + task.duration) / m.runs;
      }
    }
  }

  getHealthReport() {
    const successRate = this.metrics.totalRuns > 0 
      ? (this.metrics.successfulRuns / this.metrics.totalRuns) * 100 
      : 0;
    
    return {
      overall: {
        successRate: successRate.toFixed(2) + '%',
        totalRuns: this.metrics.totalRuns,
        averageDuration: (this.metrics.averageDuration / 1000).toFixed(2) + 's'
      },
      tasks: this.metrics.taskMetrics
    };
  }

  getMetrics(): WorkflowMetrics {
    return { ...this.metrics };
  }
}
