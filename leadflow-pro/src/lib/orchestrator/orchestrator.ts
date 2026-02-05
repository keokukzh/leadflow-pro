import { 
  WorkflowConfig, 
  TaskConfig, 
  TaskExecution, 
  ExecutionReport
} from './types';
import { ShellRunner, HttpRunner, JavaScriptRunner, RunnerResult } from './runners';

export class WorkflowOrchestrator {
  async execute(config: WorkflowConfig): Promise<ExecutionReport> {
    const startTime = Date.now();
    const tasks: Record<string, TaskExecution> = {};
    
    // Execution-specific state
    const running = new Set<string>();
    const completed = new Set<string>();
    const failed = new Set<string>();
    const results = new Map<string, unknown>();

    // Initialize task states
    config.tasks.forEach(t => {
      tasks[t.id] = {
        id: t.id,
        name: t.name,
        startTime: 0,
        status: 'pending'
      };
    });

    try {
      await this.executeTasks(config.tasks, tasks, config.environment, { 
        running, completed, failed, results 
      });
      
      const endTime = Date.now();
      return {
        id: Math.random().toString(36).substring(2, 11),
        workflow: config.name,
        startTime,
        endTime,
        duration: endTime - startTime,
        status: failed.size > 0 ? 'failed' : 'completed',
        tasks
      };
    } catch {
      const endTime = Date.now();
      return {
        id: Math.random().toString(36).substring(2, 11),
        workflow: config.name,
        startTime,
        endTime,
        duration: endTime - startTime,
        status: 'failed',
        tasks
      };
    }
  }

  private async executeTasks(
    allTasks: TaskConfig[], 
    executionState: Record<string, TaskExecution>,
    env: Record<string, string>,
    context: { 
      running: Set<string>; 
      completed: Set<string>; 
      failed: Set<string>; 
      results: Map<string, unknown> 
    }
  ) {
    const { running, completed, failed } = context;

    while (completed.size + failed.size < allTasks.length) {
      const runnableTasks = allTasks.filter(task => {
        if (completed.has(task.id) || failed.has(task.id) || running.has(task.id)) {
          return false;
        }

        if (!task.depends_on || task.depends_on.length === 0) {
          return true;
        }

        return task.depends_on.every(depId => completed.has(depId));
      });

      if (runnableTasks.length === 0 && running.size === 0) {
        // Deadlock or blocked
        break;
      }

      if (runnableTasks.length > 0) {
        const promises = runnableTasks.map(task => this.runTask(task, executionState, env, context));
        await Promise.all(promises);
      } else {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  private async runTask(
    task: TaskConfig, 
    executionState: Record<string, TaskExecution>,
    env: Record<string, string>,
    context: { 
      running: Set<string>; 
      completed: Set<string>; 
      failed: Set<string>; 
      results: Map<string, unknown> 
    }
  ) {
    const { running, completed, failed, results } = context;
    running.add(task.id);
    const state = executionState[task.id];
    state.startTime = Date.now();
    state.status = 'running';

    try {
      // Evaluate condition if present
      if (task.condition && !this.evaluateCondition(task.condition, env)) {
        state.status = 'skipped';
        completed.add(task.id);
        running.delete(task.id);
        return;
      }

      let result: RunnerResult;
      switch (task.type) {
        case 'shell':
          result = await ShellRunner.run(task);
          break;
        case 'http':
          result = await HttpRunner.run(task);
          break;
        case 'javascript':
          result = await JavaScriptRunner.run();
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      state.endTime = Date.now();
      state.duration = state.endTime - state.startTime;

      if (result.success) {
        state.status = 'completed';
        state.result = result.data || result.stdout;
        results.set(task.id, state.result);
        completed.add(task.id);
      } else {
        state.status = 'failed';
        state.error = result.error;
        failed.add(task.id);
      }
    } catch (error: unknown) {
      state.status = 'failed';
      state.error = error instanceof Error ? error.message : String(error);
      state.endTime = Date.now();
      state.duration = state.endTime - state.startTime;
      failed.add(task.id);
    } finally {
      running.delete(task.id);
    }
  }

  private evaluateCondition(condition: string, env: Record<string, string>): boolean {
    // Improved evaluation logic with regex
    let evaluated = condition;
    for (const [key, value] of Object.entries(env)) {
      evaluated = evaluated.replace(new RegExp(`\\\${env.${key}}`, 'g'), value);
    }
    
    // Support basic comparisons: ==, !=, >, <
    const match = evaluated.match(/^\s*(.+?)\s*(==|!=|>|<)\s*(.+?)\s*$/);
    if (!match) return true;

    const [, left, op, right] = match;
    const l = left.trim().replace(/^['"](.*)['"]$/, '$1');
    const r = right.trim().replace(/^['"](.*)['"]$/, '$1');

    switch (op) {
      case '==': return l === r;
      case '!=': return l !== r;
      case '>': return Number(l) > Number(r);
      case '<': return Number(l) < Number(r);
      default: return true;
    }
  }
}
