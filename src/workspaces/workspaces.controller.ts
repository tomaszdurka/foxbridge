import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PersistenceService } from '../database/persistence.service';
import { Workspace } from '../database/entities';

@ApiTags('workspaces')
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly db: PersistenceService) {}

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
}
