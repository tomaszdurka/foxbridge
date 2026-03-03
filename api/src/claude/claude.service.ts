import {Injectable, Logger} from '@nestjs/common';
import path from "node:path";
import * as fs from "node:fs";
import { Run } from '../database/entities';
import {executeCommandWithJsonStreamOutput} from "../lib/executeCommandWithJsonStreamOutput";
import {RunOptions} from "../runs/dto/run-options";


@Injectable()
export class ClaudeService {
  private readonly logger = new Logger(ClaudeService.name);

  async run(options: RunOptions): Promise<any> {
    const {run, session, workspace} = options;
    const {runId, prompt, outputSchema} = run;


    // Check if this is the first run in the session (no completed runs yet)
    const sessionRuns = session.runs?.getItems() || [];
    const isFirstRun = sessionRuns.filter((r: Run) => r.runId !== runId).length === 0;

    // Create initial CLAUDE.md file
    const claudeMdPath = path.join(workspace.workingDir, 'CLAUDE.md');
    const initialContent = `DO NOT MODIFY THIS FILE, ITS GENERATED
Please refer to:
- AGENTS.md for guidelines
- SPECIFICATION.md for expected specification 
- CHANGELOG.md for changelog`;
    fs.writeFileSync(claudeMdPath, initialContent, {
      encoding: 'utf-8',
      flag: 'w'
    });

    const permissionMode = 'bypassPermissions';
    const args = [];

    // First run: create session with --session-id
    // Subsequent runs: continue session with --resume
    if (isFirstRun) {
      args.push('--session-id', session.sessionId);
    } else {
      args.push('--resume', session.sessionId);
    }

    args.push(
      '-p',
      prompt,
      '--output-format',
      'stream-json',
      '--verbose',
      '--permission-mode',
      permissionMode,
    );

    // Add schema if provided
    if (outputSchema) {
      args.push('--json-schema', JSON.stringify(outputSchema));
    }

    // Strip Claude environment variables to avoid nesting issues
    const env = { ...process.env };
    delete env.CLAUDE_CODE;
    delete env.CLAUDECODE;

    this.logger.log(`claude ${args.join(' ')}`);

    let result: any = null;

    let sequence = 0
    await executeCommandWithJsonStreamOutput({
      command: 'claude',
      args,
      cwd: workspace.workingDir,
      env,
      onLine: (event: any) => {
        if (event.type === 'result' || event.type === 'result_success') {
          result = {
            result: event.result,
          };
          if (event.structured_output) {
            result.structuredResult = event.structured_output
          }
        }
        sequence++;
        options.onOutput?.(event);
      },
    });

    return result;
  }
}
