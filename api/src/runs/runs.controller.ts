import { Controller, Get, Post, Param, Body, Res, Headers, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { Run } from '../database/entities';
import { RunDto } from './dto/run.dto';
import { PersistenceService } from '../database/persistence.service';
import { ClaudeService } from '../claude/claude.service';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('runs')
@Controller('runs')
export class RunsController {
  constructor(
    @Inject(PersistenceService) private readonly persistence: PersistenceService,
    @Inject(ClaudeService) private readonly claude: ClaudeService,
  ) {
  }

  private async prepareRun(dto: RunDto) {
    let workspace;
    let session;

    if (dto.sessionId) {
      // Continue existing session
      session = await this.persistence.getSession({ sessionId: dto.sessionId });
      if (!session) {
        throw new NotFoundException(`Session ${dto.sessionId} not found`);
      }
      workspace = session.workspace;

      // If workspaceId also provided, validate it matches
      if (dto.workspaceId && workspace.workspaceId !== dto.workspaceId) {
        throw new BadRequestException(
          `Session ${dto.sessionId} belongs to workspace ${workspace.workspaceId}, not ${dto.workspaceId}`
        );
      }
    } else if (dto.workspaceId) {
      // Create new session in existing workspace
      workspace = await this.persistence.getWorkspace({ workspaceId: dto.workspaceId });
      if (!workspace) {
        throw new NotFoundException(`Workspace ${dto.workspaceId} not found`);
      }
      session = await this.persistence.createSession({ workspaceId: workspace.workspaceId });
    } else {
      // Create new workspace and session
      const workspaceId = uuidv4();
      const workingDir = process.env.WORKSPACES_DIR
        ? `${process.env.WORKSPACES_DIR}/${workspaceId}`
        : `${process.cwd()}/workspaces/${workspaceId}`;
      workspace = await this.persistence.createWorkspace({ workspaceId, workingDir });
      session = await this.persistence.createSession({ workspaceId: workspace.workspaceId });
    }

    // Create run
    const run = await this.persistence.createRun({
      prompt: dto.prompt,
      sessionId: session.sessionId,
      workspaceId: workspace.workspaceId,
      outputSchema: dto.schema,
    });

    return { run, session, workspace };
  }

  @Post('queue')
  @ApiOperation({
    summary: 'Queue run execution',
    description: 'Queue a Claude CLI run for execution and return immediately with 201 Created. Provide sessionId to continue session, workspaceId to create new session in workspace, or neither to create new workspace.'
  })
  @ApiResponse({
    status: 201,
    description: 'Job queued successfully',
    schema: {
      type: 'object',
      properties: {
        runId: { type: 'string' },
        sessionId: { type: 'string' },
        workspaceId: { type: 'string' },
      }
    }
  })
  async queueRun(@Body() dto: RunDto, @Res() res: Response): Promise<void> {
    const { run, session, workspace } = await this.prepareRun(dto);

    // Start job asynchronously
    this.claude.run({
      prompt: dto.prompt,
      runId: run.runId,
      sessionId: session.sessionId,
      workingDir: workspace.workingDir,
      schema: dto.schema,
    }).catch(err => {
      console.error(`Error in background job ${run.runId}:`, err);
    });

    res.status(201).json({
      runId: run.runId,
      sessionId: session.sessionId,
      workspaceId: workspace.workspaceId,
    });
  }

  @Post()
  @ApiOperation({
    summary: 'Execute run',
    description: 'Execute a Claude CLI run. Supports streaming (application/x-ndjson) and buffered modes. Provide sessionId to continue session, workspaceId to create new session in workspace, or neither to create new workspace.'
  })
  @ApiResponse({ status: 200, description: 'Run completed or streaming' })
  async executeRun(
    @Body() dto: RunDto,
    @Headers('accept') accept: string,
    @Res() res: Response,
  ): Promise<void> {
    const { run, session, workspace } = await this.prepareRun(dto);

    const isStreaming = accept?.includes('application/x-ndjson');
    let clientDisconnected = false;

    const writeEvent = (event: any) => {
      if (!clientDisconnected) {
        res.write(JSON.stringify({
          timestamp: new Date().toISOString(),
          workspaceId: workspace.workspaceId,
          sessionId: session.sessionId,
          runId: run.runId,
          ...event
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
      runId: run.runId,
      sessionId: session.sessionId,
      workingDir: workspace.workingDir,
      schema: dto.schema,
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
