import {Inject, Injectable, Logger} from '@nestjs/common';
import {RunsService} from '../runs/runs.service';
import path from "node:path";
import * as fs from "node:fs";
import {enhancePrompt} from "../lib/enhancePrompt";
import {PersistenceService} from "../database/persistence.service";
import {RunStatus} from "../database/entities";
import { Run } from '../database/entities';

export type RunOptions = {
  prompt: string;
  runId: string;
  sessionId: string;
  workingDir: string;
  outputSchema?: Record<string, unknown>;
  onOutput?: (line: unknown) => void;
}

@Injectable()
export class ClaudeService {
  private readonly logger = new Logger(ClaudeService.name);

  constructor(
      @Inject(RunsService) private readonly runsService: RunsService,
      private readonly persistence: PersistenceService,
  ) {}

  async run(options: RunOptions): Promise<unknown> {

    const {runId, sessionId}= options

    // Fetch session and check if it's the first run
    const session = await this.persistence.getSession({ sessionId });
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Check if this is the first run in the session (no completed runs yet)
    const sessionRuns = session.runs?.getItems() || [];
    const isFirstRun = sessionRuns.filter((r: Run) => r.runId !== runId).length === 0;

    // Create initial CLAUDE.md file
    const claudeMdPath = path.join(options.workingDir, 'CLAUDE.md');
    const initialContent = `DO NOT MODIFY THIS FILE, ITS GENERATED
Please refer to:
- AGENTS.md for guidelines
- SPECIFICATION.md for expected specification 
- CHANGELOG.md for changelog`;
    fs.writeFileSync(claudeMdPath, initialContent, {
      encoding: 'utf-8',
      flag: 'w'
    });

    const enhancedPrompt = enhancePrompt(options);
    const permissionMode = 'bypassPermissions';
    const args = [];

    // First run: create session with --session-id
    // Subsequent runs: continue session with --resume
    if (isFirstRun) {
      args.push('--session-id', sessionId);
    } else {
      args.push('--resume', sessionId);
    }

    args.push(
      '-p',
      enhancedPrompt,
      '--output-format',
      'stream-json',
      '--verbose',
      '--permission-mode',
      permissionMode,
    );

    // Add schema if provided
    if (options.outputSchema) {
      args.push('--json-schema', JSON.stringify(options.outputSchema));
    }

    // Strip Claude environment variables to avoid nesting issues
    const env = { ...process.env };
    delete env.CLAUDE_CODE;
    delete env.CLAUDECODE;

    this.logger.log(`claude ${args.join(' ')}`);

    let result: any = null;

    let sequence = 0
    const code = await this.runsService.executeJsonStream({
      command: 'claude',
      args,
      cwd: options.workingDir,
      env,
      onLine: (event: any) => {
        if (event.type === 'result' || event.type === 'result_success') {
          result = event;
        }
        sequence++;
        options.onOutput?.(event);
        this.persistence.storeEvent({
          runId,
          event,
          sequence,
        })
      },
    });

    await this.persistence.setStatus({
      runId,
      result,
      exitCode: code ?? 0,
      status: RunStatus.SUCCESS,
    })

    return result;
  }
}
