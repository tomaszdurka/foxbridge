import { Controller, Get, Param, Patch, Body, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { PersistenceService } from '../database/persistence.service';
import { Workspace } from '../database/entities';
import { UpdateWorkspaceDto } from './dto';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('workspaces')
@Controller('workspaces')
export class WorkspacesController {
  constructor(
    private readonly db: PersistenceService,
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
}
