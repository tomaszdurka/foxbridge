import { Controller, Post, Get, Param, Body, Res, Headers, Req, Inject, NotFoundException } from '@nestjs/common';
import {ApiTags, ApiOperation, ApiResponse, ApiParam, ApiHeader} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { RunDto } from './dto/run.dto';
import { Run, RunEvent } from '../database/entities';
import { ClaudeService } from '../claude/claude.service';
import { RunsService } from './runs.service';
import { PersistenceService } from '../database/persistence.service';
import path from "path";
import { v4 as uuidv4 } from 'uuid';

@ApiTags('runs')
@Controller('runs')
export class RunsController {
  constructor(
    @Inject(ClaudeService) private readonly claude: ClaudeService,
    @Inject(RunsService) private readonly runs: RunsService,
    @Inject(PersistenceService) private readonly persistence: PersistenceService,
  ) {
  }

  @Post('queue/claude')
  @ApiOperation({
    summary: 'Queue Claude prompt execution',
    description: 'Queue a Claude CLI prompt for execution and return immediately with 201 Created. The job will run in the background.'
  })
  @ApiResponse({
    status: 201,
    description: 'Job queued successfully',
    schema: {
      type: 'object',
      properties: {
        runId: { type: 'string' },
        workspaceId: { type: 'string' },
        status: { type: 'string' },
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid request body or workspace ID format' })
  async queueClaude(
    @Body() dto: RunDto,
    @Res() res: Response,
  ): Promise<void> {
    const { runId, workspace } = await this.runs.createRun({
      workspaceId: dto.workspaceId,
      workspaceName: dto.workspaceName,
      outputSchema: dto.schema,
      prompt: dto.prompt,
    });

    // Start the job asynchronously (don't await)
    this.claude.run({
      prompt: dto.prompt,
      runId,
      workingDir: workspace.workingDir,
      outputSchema: dto.schema,
    }).catch(err => {
      console.error(`Error in background job ${runId}:`, err);
    });

    res.status(201).json({
      runId,
      workspaceId: workspace.workspaceId,
      status: 'queued',
    });
  }

  @Post('claude')
  @ApiOperation({
    summary: 'Execute Claude prompt',
    description: 'Execute a Claude CLI prompt with optional JSON schema output. Supports both streaming (application/x-ndjson) and buffered response modes.'
  })
  @ApiResponse({
    status: 200,
    description: 'Claude execution started. Returns NDJSON stream if Accept header is application/x-ndjson, otherwise returns buffered result.'
  })
  @ApiResponse({ status: 400, description: 'Invalid request body or workspace ID format' })
  async executeClaude(
    @Body() dto: RunDto,
    @Headers('accept') accept: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const {runId, workspace} = await this.runs.createRun({
      workspaceId: dto.workspaceId,
      workspaceName: dto.workspaceName,
      outputSchema: dto.schema,
      prompt: dto.prompt,
    })

    const isStreaming = accept?.includes('application/x-ndjson');
    let clientDisconnected = false;

    const writeEvent = (e: any) => {
      if (!clientDisconnected) {
        res.write(JSON.stringify({
          timestamp: new Date().toISOString(),
          workspaceId: workspace.workspaceId,
          runId,
          ...e
        }) + '\n');
      }
    };

    res.on('close', () => clientDisconnected = true);

    if (isStreaming) {
      res.setHeader('Content-Type', 'application/x-ndjson');
      res.setHeader('Cache-Control', 'no-cache');
      writeEvent({ type: 'start' });
    }

    const result = await this.claude.run({
      prompt: dto.prompt,
      runId,
      workingDir: workspace.workingDir,
      outputSchema: dto.schema,
      onOutput: isStreaming ? writeEvent : undefined,
    });

    if (!isStreaming) {
      writeEvent(result);
    }

    res.end();
  }

  @Get()
  @ApiOperation({ summary: 'List all runs', description: 'Get a list of all Claude runs across all workspaces' })
  @ApiResponse({ status: 200, description: 'List of runs', type: [Run] })
  async listRuns(): Promise<Run[]> {
    return await this.persistence.findAllRuns();
  }

  @Get(':runId')
  @ApiOperation({ summary: 'Get run details', description: 'Get detailed information about a specific run including all events' })
  @ApiParam({ name: 'runId'})
  @ApiResponse({ status: 200, description: 'Run details with events', type: Run })
  @ApiResponse({ status: 404, description: 'Run not found' })
  async getRun(@Param('runId') runId: string): Promise<Run> {
    const run = await this.persistence.findRunWithEvents({ runId });

    if (!run) {
      throw new NotFoundException(`Run ${runId} not found`);
    }

    return run;
  }
}
