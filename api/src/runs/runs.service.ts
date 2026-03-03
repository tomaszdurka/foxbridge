import {BadRequestException, Injectable, Logger} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import {PersistenceService} from "../database/persistence.service";
import {Workspace} from "../database/entities";


@Injectable()
export class RunsService {

  constructor(private readonly persistence: PersistenceService) {
  }

  private readonly logger = new Logger(RunsService.name);
  private readonly workspacesDir = process.env.WORKSPACES_DIR || path.join(process.cwd(), 'workspaces');

  async ensureWorkspace(existingWorkspaceId?: string, name?: string): Promise<Pick<Workspace, 'workspaceId' | 'workingDir'>> {
    if (existingWorkspaceId) {
      // Validate that the workspace exists
      // const workspace = await this.persistence.findWorkspace({workspaceId: existingWorkspaceId})
      const workspace = await this.ensureLegacyDirectoryOnlyWorkspace(existingWorkspaceId)
      if (!workspace) {
        throw new BadRequestException(`Workspace ${existingWorkspaceId} does not exist`);
      }
      const {workspaceId, workingDir} = workspace
      if (!fs.existsSync(workingDir) || !fs.statSync(workingDir).isDirectory()) {
        throw new BadRequestException(`Workspace ${existingWorkspaceId} is not a directory`);
      }
      return { workspaceId, workingDir };
    } else {
      // Create new workspace
      const workspaceId = uuidv4();
      const workingDir = path.join(this.workspacesDir, workspaceId);
      await this.persistence.createWorkspace({
          workspaceId,
          workingDir,
          name,
      });
      return { workspaceId, workingDir };
    }
  }

  async ensureLegacyDirectoryOnlyWorkspace(workspaceId: string) {
    const workspace = await this.persistence.findWorkspace({
      workspaceId,
    })
    if (workspace) {
      return workspace
    }
    const workingDir = path.join(this.workspacesDir, workspaceId);
    if (!fs.existsSync(workingDir) || !fs.statSync(workingDir).isDirectory()) {
      return null
    }
    return this.persistence.createWorkspace({
      workspaceId,
      workingDir,
    });
  }
}
