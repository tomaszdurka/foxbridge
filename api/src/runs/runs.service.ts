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
    const {run, session, workspace} = options
    const {runId} = run

    let prompt = enhancePrompt(run);
    let model = run.model;

    if (session.runs.length > 0) {
      const lastRun = session.runs[session.runs.length - 1];
      const lastModel = lastRun.model
      if (!model) {
        model = lastModel
      }
      if (model !== lastModel) {
        prompt = `IMPORTANT: The model has been switched from ${lastModel} to ${model}. Be aware that external changes may have occurred since the last run. Review the workspace state carefully before proceeding.\n\n`
            + prompt
      }
    }

    if (!model) {
      model = 'claude'
    }

    let sequence = 0
    const result = await this.runProvider(model, {
      run: {...run, prompt},
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
