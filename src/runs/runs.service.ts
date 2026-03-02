import {BadRequestException, Injectable, Logger} from '@nestjs/common';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

export interface WorkspaceContext {
  workspaceId: string;
  runId: string;
  workingDir: string;
}

@Injectable()
export class RunsService {
  private readonly logger = new Logger(RunsService.name);
  private readonly workspacesDir = path.join(process.cwd(), 'workspaces');

  /**
   * Create a new workspace directory for execution or use existing one
   * @param existingWorkspaceId - Optional existing workspace ID to reuse
   * @throws Error if existingWorkspaceId is provided but doesn't exist
   */
  ensureWorkspace(existingWorkspaceId?: string): WorkspaceContext {
    const workspaceId = existingWorkspaceId || uuidv4();
    const runId = uuidv4();
    const workingDir = path.join(this.workspacesDir, workspaceId);

    if (existingWorkspaceId) {
      // Validate that the workspace exists
      if (!fs.existsSync(workingDir) || !fs.statSync(workingDir).isDirectory()) {
        throw new BadRequestException(`Workspace ${existingWorkspaceId} is not a directory`);
      }
    } else {
      // Create new workspace
      fs.mkdirSync(workingDir, { recursive: true });
    }

    return { workspaceId, runId, workingDir };
  }

  /**
   * Execute a command that outputs newline-delimited JSON
   */
  async executeJsonStream(options: {
    command: string;
    args: string[];
    cwd: string;
    env?: NodeJS.ProcessEnv;
    onLine?: (parsed: any) => void;
  }): Promise<number | null> {
    return new Promise((resolve, reject) => {
      const child = spawn(options.command, options.args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: options.cwd,
        env: options.env || process.env,
      });

      let stdoutBuffer = '';
      let stderrBuffer = '';

      const handleOutput = (data: string, buffer: string) => {
        this.logger.debug(data)
        buffer += data;
        const lines = buffer.split('\n');
        const remaining = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const event = JSON.parse(line);
              options.onLine?.(event);
            } catch (err) {
              this.logger.error(`Failed to parse JSON: ${line}`);
            }
          }
        }

        return remaining;
      };

      child.on('error', (err) => {
        reject(new Error(`Failed to spawn ${options.command}: ${err.message}`));
      });

      child.stdout?.on('data', (chunk: Buffer) => {
        stdoutBuffer = handleOutput(chunk.toString(), stdoutBuffer);
      });

      child.stderr?.on('data', (chunk: Buffer) => {
        stderrBuffer = handleOutput(chunk.toString(), stderrBuffer);
      });

      child.on('close', (code) => {
        resolve(code);
      });

      child.stdin?.end();
    });
  }
}
