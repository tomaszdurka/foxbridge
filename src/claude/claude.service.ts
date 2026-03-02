import { Injectable, Logger, Inject } from '@nestjs/common';
import { RunsService } from '../runs/runs.service';

@Injectable()
export class ClaudeService {
  private readonly logger = new Logger(ClaudeService.name);

  constructor(@Inject(RunsService) private readonly runsService: RunsService) {}

  async run(options: {
    prompt: string;
    workingDir: string;
    outputSchema?: Record<string, unknown>;
    onOutput?: (line: unknown) => void;
  }): Promise<unknown> {
    // Enhance prompt with CLAUDE.md maintenance instructions
    const enhancedPrompt = `${options.prompt}

IMPORTANT: After completing the task, update the CLAUDE.md file in the workspace with:
- Current state of the project
- What was accomplished in this run
- Next steps or pending tasks
- Any important context for future runs

This helps maintain continuity across multiple runs in the same workspace.`;

    const permissionMode = 'bypassPermissions';
    const args = [
      '-p',
      enhancedPrompt,
      '--output-format',
      'stream-json',
      '--verbose',
      '--permission-mode',
      permissionMode,
    ];

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

    await this.runsService.executeJsonStream({
      command: 'claude',
      args,
      cwd: options.workingDir,
      env,
      onLine: (event: any) => {
        if (event.type === 'result' || event.type === 'result_success') {
          result = event;
        }
        options.onOutput?.(event);
      },
    });

    return result;
  }
}
