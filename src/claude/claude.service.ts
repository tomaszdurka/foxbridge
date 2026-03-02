import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';

@Injectable()
export class ClaudeService {
  private readonly logger = new Logger(ClaudeService.name);

  async run(options: {
    prompt: string;
    workingDir: string;
    outputSchema?: Record<string, unknown>;
    onOutput?: (line: unknown) => void;
  }): Promise<{ status: 'success' | 'failure'; response: unknown }> {
    return new Promise((resolve) => {
      const args = [
        '-p',
        options.prompt,
        '--output-format',
        'stream-json',
        '--verbose',
        '--dangerously-skip-permissions',
      ];

      // Add schema if provided
      if (options.outputSchema) {
        args.push('--json-schema', JSON.stringify(options.outputSchema));
      }

      let result:any = null;

      const handleOutput = (data: string) => {
        // Parse and send each line
        this.logger.log(data);
        const lines = data.split('\n').filter(l => l.trim());
        for (const line of lines) {
          const event = JSON.parse(line);
          if (event.type === 'result' || event.type === 'result_success') {
            result = event;
          }
          options.onOutput?.(event);
        }
      }

      // Strip Claude environment variables to avoid nesting issues
      const env = { ...process.env };
      delete env.CLAUDE_CODE;
      delete env.CLAUDECODE;

      // Spawn the claude process
      console.log('claude ' + args.join(' '));

      const child = spawn('claude', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: options.workingDir,
        env,
      });

      // Handle spawn errors
      child.on('error', (err) => {
        const errorMsg = `Failed to spawn claude: ${err.message}`;
        this.logger.error(errorMsg);
        resolve({
          status: 'failure',
          response: errorMsg,
        });
      });

      // Collect stdout
      child.stdout?.on('data', (chunk: Buffer) => {
        const data = chunk.toString();
        handleOutput(data);
      });

      // Collect stderr
      child.stderr?.on('data', (chunk: Buffer) => {
        const data = chunk.toString();
        handleOutput(data);
      });

      // Handle process completion
      child.on('close', (code) => {
        resolve(result);
      });
      child.stdin?.end();
    });
  }
}
