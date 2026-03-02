import { Controller, Post, Body, Res, Headers, Req, Inject } from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { RunClaudeDto } from './dto/run-claude.dto';
import { ClaudeService } from '../claude/claude.service';
import { StreamEvent } from '../types';

@Controller('runs')
export class RunsController {
  constructor(@Inject(ClaudeService) private readonly claude: ClaudeService) {
    console.log('RunsController constructor - claude service:', this.claude);
  }

  @Post('claude')
  async executeClaude(
    @Body() dto: RunClaudeDto,
    @Headers('accept') accept: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const workspaceId = uuidv4();
    const runId = uuidv4();
    const workingDir = path.join(process.cwd(), 'workspaces', workspaceId);
    fs.mkdirSync(workingDir, { recursive: true });

    const isStreaming = accept?.includes('application/x-ndjson');
    let writeEvent = (e: any) => undefined

    let clientDisconnected = false;
    res.on('close', () => clientDisconnected = true);

    if (isStreaming) {
      writeEvent = (e: any) => {
        if (!clientDisconnected) {
          res.write(JSON.stringify(e) + '\n');
        }
      }
      res.setHeader('Content-Type', 'application/x-ndjson');
      res.setHeader('Cache-Control', 'no-cache');
    }

    writeEvent({
      type: 'start',
      workspaceId,
      runId,
      timestamp: new Date().toISOString(),
    });

    const result = await this.claude.run({
      prompt: dto.prompt,
      workingDir,
      outputSchema: dto.schema,
      onOutput: writeEvent
    });


    if (isStreaming) {
      writeEvent({
        workspaceId,
        runId,
        result,
      });
      res.end();
    } else {
      res.json({
        workspaceId,
        runId,
        result,
      });
    }
  }
}
