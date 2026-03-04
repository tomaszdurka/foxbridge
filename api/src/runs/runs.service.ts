import {Injectable, Logger} from '@nestjs/common';
import {PersistenceService} from "../database/persistence.service";
import {RunStatus} from "../database/entities";
import {enhancePrompt} from "../lib/enhancePrompt";
import {RunOptions} from "./dto/run-options";
import {ClaudeService} from "../claude/claude.service";
import {GeminiService} from "../gemini/gemini.service";
import {CodexService} from "../codex/codex.service";


@Injectable()
export class RunsService {

  constructor(
      private readonly persistence: PersistenceService,
      private readonly claudeService: ClaudeService,
      private readonly geminiService: GeminiService,
      private readonly codexService: CodexService,
  ) {
  }
  private readonly logger = new Logger(RunsService.name);

  async runProvider(provider:string, options: RunOptions) {
    if (provider === 'claude') {
        return this.claudeService.run(options)
    }
    if (provider === 'gemini') {
        return this.geminiService.run(options)
    }
    if (provider === 'codex') {
        return this.codexService.run(options)
    }
    throw new Error('Invalid provider');
  }


  async run(options: RunOptions): Promise<unknown> {
    const provider = 'claude'
    const {run, session, workspace} = options
    const {runId, prompt} = run

    const enhancedPrompt = enhancePrompt(run);

    let sequence = 0
    const result = await this.runProvider(provider, {
      run: {...run, prompt: enhancedPrompt},
      session,
      workspace,
      onOutput: (event: any) => {
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
      exitCode: 0,
      status: RunStatus.SUCCESS,
    })

    return result;
  }
}
