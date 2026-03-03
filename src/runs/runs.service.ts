import {BadRequestException, Injectable, Logger} from '@nestjs/common';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import {PersistenceService} from "../database/persistence.service";
import {Workspace} from "../database/entities";


@Injectable()
export class RunsService {

  constructor(private readonly persistence: PersistenceService) {
  }

  private readonly logger = new Logger(RunsService.name);
  private readonly workspacesDir = process.env.WORKSPACES_DIR || path.join(process.cwd(), 'workspaces');

  async ensureWorkspace(existingWorkspaceId?: string, name?: string): Promise<Pick<Workspace, 'workspaceId' | 'workingDir'>> {
    if (existingWorkspaceId) {
      // Validate that the workspace exists
      // const workspace = await this.persistence.findWorkspace({workspaceId: existingWorkspaceId})
      const workspace = await this.ensureLegacyDirectoryOnlyWorkspace(existingWorkspaceId)
      if (!workspace) {
        throw new BadRequestException(`Workspace ${existingWorkspaceId} does not exist`);
      }
      const {workspaceId, workingDir} = workspace
      if (!fs.existsSync(workingDir) || !fs.statSync(workingDir).isDirectory()) {
        throw new BadRequestException(`Workspace ${existingWorkspaceId} is not a directory`);
      }
      return { workspaceId, workingDir };
    } else {
      // Create new workspace
      const workspaceId = uuidv4();
      const workingDir = path.join(this.workspacesDir, workspaceId);
      await this.persistence.createWorkspace({
          workspaceId,
          workingDir,
          name,
      });
      return { workspaceId, workingDir };
    }
  }

  async ensureLegacyDirectoryOnlyWorkspace(workspaceId: string) {
    const workspace = await this.persistence.findWorkspace({
      workspaceId,
    })
    if (workspace) {
      return workspace
    }
    const workingDir = path.join(this.workspacesDir, workspaceId);
    if (!fs.existsSync(workingDir) || !fs.statSync(workingDir).isDirectory()) {
      return null
    }
    return this.persistence.createWorkspace({
      workspaceId,
      workingDir,
    });
  }


  async createRun({workspaceId: optionalWorkspaceId, workspaceName, prompt, outputSchema}: {
    workspaceId?: string;
    workspaceName?: string;
    prompt: string;
    outputSchema?: object;
  }) {
    const { workspaceId } = await this.ensureWorkspace(optionalWorkspaceId, workspaceName);
    return this.persistence.createRun({
      workspaceId,
      prompt,
      outputSchema
    })
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
