import { Controller, Post, Body, Res, Headers, Req, Inject, BadRequestException } from '@nestjs/common';
import { Request, Response } from 'express';
import { RunDto } from './dto/run.dto';
import { ClaudeService } from '../claude/claude.service';
import { RunsService } from './runs.service';
import { StreamEvent } from '../types';

@Controller('runs')
export class RunsController {
  constructor(
    @Inject(ClaudeService) private readonly claude: ClaudeService,
    @Inject(RunsService) private readonly runs: RunsService,
  ) {
  }

  @Post('claude')
  async executeClaude(
    @Body() dto: RunDto,
    @Headers('accept') accept: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const { workspaceId, runId, workingDir } = this.runs.ensureWorkspace(dto.workspaceId);
    const isStreaming = accept?.includes('application/x-ndjson');
    let clientDisconnected = false;
    const writeEvent = (e: any) => {
        if (!clientDisconnected) {
            res.write(JSON.stringify({
                timestamp: new Date().toISOString(),
                workspaceId,
                runId,
                ...e
            }) + '\n');
        }
    }

    res.on('close', () => clientDisconnected = true);

    if (isStreaming) {
      res.setHeader('Content-Type', 'application/x-ndjson');
      res.setHeader('Cache-Control', 'no-cache');
      writeEvent({
        type: 'start',
      });
    }
    const result = await this.claude.run({
      prompt: dto.prompt,
      runId,
      workingDir,
      outputSchema: dto.schema,
      onOutput: isStreaming ? writeEvent : undefined,
    });

    if (!isStreaming) {
        writeEvent(result);
    }
    res.end();
  }
}
