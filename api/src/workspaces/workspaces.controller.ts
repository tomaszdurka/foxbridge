import { Controller, Get, Param, Patch, Body, Post, Res, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { PersistenceService } from '../database/persistence.service';
import { ClaudeService } from '../claude/claude.service';
import { RunsService } from '../runs/runs.service';
import { Workspace, Run } from '../database/entities';
import { UpdateWorkspaceDto } from './dto';
import { RunDto } from '../runs/dto/run.dto';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('workspaces')
@Controller('workspaces')
export class WorkspacesController {
  constructor(
    private readonly db: PersistenceService,
    @Inject(ClaudeService) private readonly claude: ClaudeService,
    @Inject(RunsService) private readonly runs: RunsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all workspaces', description: 'Get a list of all Claude workspaces' })
  @ApiResponse({ status: 200, description: 'List of workspaces', type: [Workspace] })
  async listWorkspaces(): Promise<Workspace[]> {
    return await this.db.findAllWorkspaces();
  }

  @Get(':workspaceId')
  @ApiOperation({ summary: 'Get workspace details', description: 'Get detailed information about a workspace including all its runs' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: 'Workspace details with runs', type: Workspace })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async getWorkspace(@Param('workspaceId') workspaceId: string): Promise<Workspace> {
    const workspace = await this.db.findWorkspaceWithRuns({ id: workspaceId });

    if (!workspace) {
      throw new NotFoundException(`Workspace ${workspaceId} not found`);
    }

    return workspace;
  }

  @Patch(':workspaceId')
  @ApiOperation({ summary: 'Update workspace', description: 'Update workspace properties like name' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiBody({ type: UpdateWorkspaceDto })
  @ApiResponse({ status: 200, description: 'Workspace updated successfully', type: Workspace })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async updateWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Body() updateDto: UpdateWorkspaceDto
  ): Promise<Workspace> {
    const workspace = await this.db.updateWorkspace({
      workspaceId,
      ...updateDto
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace ${workspaceId} not found`);
    }

    return workspace;
  }

  @Get(':workspaceId/files/:filename')
  @ApiOperation({
    summary: 'Read workspace file',
    description: 'Read specific markdown files from the workspace directory (CHANGELOG.md, SPECIFICATION.md, AGENTS.md)'
  })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiParam({
    name: 'filename',
    description: 'File name',
    enum: ['CHANGELOG.md', 'SPECIFICATION.md', 'AGENTS.md'],
    example: 'AGENTS.md'
  })
  @ApiResponse({ status: 200, description: 'File content', schema: { type: 'object', properties: { content: { type: 'string' } } } })
  @ApiResponse({ status: 404, description: 'Workspace or file not found' })
  @ApiResponse({ status: 400, description: 'Invalid filename' })
  async getWorkspaceFile(
    @Param('workspaceId') workspaceId: string,
    @Param('filename') filename: string
  ): Promise<{ content: string; filename: string }> {
    // Whitelist of allowed files
    const allowedFiles = ['CHANGELOG.md', 'SPECIFICATION.md', 'AGENTS.md'];

    if (!allowedFiles.includes(filename)) {
      throw new BadRequestException(`File ${filename} is not allowed. Allowed files: ${allowedFiles.join(', ')}`);
    }

    const workspace = await this.db.getWorkspace({ workspaceId });
    if (!workspace) {
      throw new NotFoundException(`Workspace ${workspaceId} not found`);
    }

    const filePath = path.join(workspace.workingDir, filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`File ${filename} not found in workspace`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return { content, filename };
  }

  @Post(':workspaceId/runs/queue')
  @ApiOperation({
    summary: 'Queue run in workspace (new session)',
    description: 'Create a new session in the workspace and queue a run. Returns immediately with 201 Created.'
  })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID', example: '550e8400-e29b-41d4-a716-446655440000' })
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
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async queueRunInWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: RunDto,
    @Res() res: Response,
  ): Promise<void> {
    const workspace = await this.db.getWorkspace({ workspaceId });
    if (!workspace) {
      throw new NotFoundException(`Workspace ${workspaceId} not found`);
    }

    // Create new session
    const session = await this.db.createSession({ workspaceId });

    // Create run
    const run = await this.db.createRun({
      prompt: dto.prompt,
      sessionId: session.sessionId,
      workspaceId,
      outputSchema: dto.schema,
    });

    // Start the job asynchronously (don't await)
    this.claude.run({
      prompt: dto.prompt,
      runId: run.runId,
      sessionId: session.sessionId,
      workingDir: workspace.workingDir,
      outputSchema: dto.schema,
    }).catch(err => {
      console.error(`Error in background job ${run.runId}:`, err);
    });

    res.status(201).json({
      runId: run.runId,
      sessionId: session.sessionId,
      workspaceId,
      status: 'queued',
    });
  }

  @Post(':workspaceId/runs')
  @ApiOperation({
    summary: 'Execute run in workspace (new session)',
    description: 'Create a new session in the workspace and execute a run. Supports streaming.'
  })
  @ApiParam({ name: 'workspaceId', description: 'Workspace ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiBody({ type: RunDto })
  @ApiResponse({ status: 200, description: 'Run completed' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async executeRunInWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: RunDto,
    @Res() res: Response,
  ): Promise<void> {
    const workspace = await this.db.getWorkspace({ workspaceId });
    if (!workspace) {
      throw new NotFoundException(`Workspace ${workspaceId} not found`);
    }

    // Create new session
    const session = await this.db.createSession({ workspaceId });

    // Create run
    const run = await this.db.createRun({
      prompt: dto.prompt,
      sessionId: session.sessionId,
      workspaceId,
      outputSchema: dto.schema,
    });

    const result = await this.claude.run({
      prompt: dto.prompt,
      runId: run.runId,
      sessionId: session.sessionId,
      workingDir: workspace.workingDir,
      outputSchema: dto.schema,
    });

    res.json({
      timestamp: new Date().toISOString(),
      workspaceId,
      sessionId: session.sessionId,
      runId: run.runId,
      ...(result as any)
    });
  }
}
