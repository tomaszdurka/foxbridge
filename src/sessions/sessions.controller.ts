import { Controller, Post, Param, Body, Res, Inject, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { PersistenceService } from '../database/persistence.service';
import { ClaudeService } from '../claude/claude.service';
import { RunDto } from '../runs/dto/run.dto';

@ApiTags('sessions')
@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly db: PersistenceService,
    @Inject(ClaudeService) private readonly claude: ClaudeService,
  ) {}

  @Post(':sessionId/runs/queue')
  @ApiOperation({
    summary: 'Queue run in existing session',
    description: 'Continue an existing session by queuing a new run. Returns immediately with 201 Created.'
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiBody({ type: RunDto })
  @ApiResponse({
    status: 201,
    description: 'Job queued successfully',
    schema: {
      type: 'object',
      properties: {
        runId: { type: 'string' },
        sessionId: { type: 'string' },
        workspaceId: { type: 'string' },
        status: { type: 'string' },
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async queueRunInSession(
    @Param('sessionId') sessionId: string,
    @Body() dto: RunDto,
    @Res() res: Response,
  ): Promise<void> {
    const session = await this.db.getSession({ sessionId });
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    const workspace = session.workspace;
    if (!workspace) {
      throw new NotFoundException(`Workspace for session ${sessionId} not found`);
    }

    // Create run in existing session
    const run = await this.db.createRun({
      prompt: dto.prompt,
      sessionId,
      workspaceId: workspace.workspaceId,
      outputSchema: dto.schema,
    });

    // Start the job asynchronously (don't await)
    this.claude.run({
      prompt: dto.prompt,
      runId: run.runId,
      sessionId,
      workingDir: workspace.workingDir,
      outputSchema: dto.schema,
    }).catch(err => {
      console.error(`Error in background job ${run.runId}:`, err);
    });

    res.status(201).json({
      runId: run.runId,
      sessionId,
      workspaceId: workspace.workspaceId,
      status: 'queued',
    });
  }

  @Post(':sessionId/runs')
  @ApiOperation({
    summary: 'Execute run in existing session',
    description: 'Continue an existing session by executing a new run. Supports streaming.'
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiBody({ type: RunDto })
  @ApiResponse({ status: 200, description: 'Run completed' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async executeRunInSession(
    @Param('sessionId') sessionId: string,
    @Body() dto: RunDto,
    @Res() res: Response,
  ): Promise<void> {
    const session = await this.db.getSession({ sessionId });
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    const workspace = session.workspace;
    if (!workspace) {
      throw new NotFoundException(`Workspace for session ${sessionId} not found`);
    }

    // Create run in existing session
    const run = await this.db.createRun({
      prompt: dto.prompt,
      sessionId,
      workspaceId: workspace.workspaceId,
      outputSchema: dto.schema,
    });

    const result = await this.claude.run({
      prompt: dto.prompt,
      runId: run.runId,
      sessionId,
      workingDir: workspace.workingDir,
      outputSchema: dto.schema,
    });

    res.json({
      timestamp: new Date().toISOString(),
      workspaceId: workspace.workspaceId,
      sessionId,
      runId: run.runId,
      ...(result as any)
    });
  }
}
