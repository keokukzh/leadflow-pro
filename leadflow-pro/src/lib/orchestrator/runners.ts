import { spawn } from 'child_process';
import axios, { AxiosRequestConfig } from 'axios';
import { TaskConfig } from './types';

export interface RunnerResult {
  success: boolean;
  data?: unknown;
  error?: string;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
}

export class ShellRunner {
  static async run(task: TaskConfig): Promise<RunnerResult> {
    const command = task.command;
    if (!command) throw new Error('Shell task missing command');

    return new Promise((resolve) => {
      const childProcess = spawn(command, [], {
        cwd: task.cwd || process.cwd(),
        env: { ...process.env, ...task.environment },
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      let stdout = '';
      let stderr = '';

      childProcess.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
        if (task.live_output) {
          process.stdout.write(data);
        }
      });

      childProcess.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
        if (task.live_output) {
          process.stderr.write(data);
        }
      });

      const timeout = setTimeout(() => {
        childProcess.kill('SIGKILL');
        resolve({
          success: false,
          error: `Task timeout after ${task.timeout || 300000}ms`,
          stdout,
          stderr
        });
      }, task.timeout || 300000);

      childProcess.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          resolve({ success: true, stdout, stderr, exitCode: code ?? undefined });
        } else {
          resolve({
            success: false,
            error: `Shell command failed with exit code ${code}`,
            stdout,
            stderr,
            exitCode: code ?? undefined
          });
        }
      });
    });
  }
}

export class HttpRunner {
  static async run(task: TaskConfig): Promise<RunnerResult> {
    if (!task.url) throw new Error('HTTP task missing URL');

    const config: AxiosRequestConfig = {
      method: (task.method || 'GET') as any, // axios method is a union of strings
      url: task.url,
      headers: task.headers || {},
      data: task.data,
      auth: task.auth as AxiosRequestConfig['auth'],
      timeout: task.timeout || 30000
    };

    try {
      const response = await axios(config);
      return {
        success: true,
        data: {
          status: response.status,
          data: response.data,
          headers: response.headers
        }
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const responseData = (error as any)?.response?.data;
      return {
        success: false,
        error: `HTTP request failed: ${message}`,
        data: responseData
      };
    }
  }
}

export class JavaScriptRunner {
  static async run(): Promise<RunnerResult> {
    // Basic implementation for now - could use eval or vm module
    // For safety, we might want to restrict this to pre-defined scripts
    return { success: false, error: 'JavaScriptRunner not fully implemented' };
  }
}


