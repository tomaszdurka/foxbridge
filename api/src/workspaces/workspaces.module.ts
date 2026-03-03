import { Module, forwardRef } from '@nestjs/common';
import { PersistenceModule } from '../database/persistence.module';
import { ClaudeModule } from '../claude/claude.module';
import { RunsModule } from '../runs/runs.module';
import { WorkspacesController } from './workspaces.controller';

@Module({
  imports: [
    PersistenceModule,
    forwardRef(() => ClaudeModule),
    forwardRef(() => RunsModule),
  ],
  controllers: [WorkspacesController],
})
export class WorkspacesModule {}
