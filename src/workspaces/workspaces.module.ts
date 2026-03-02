import { Module } from '@nestjs/common';
import { PersistenceModule } from '../database/persistence.module';
import { WorkspacesController } from './workspaces.controller';

@Module({
  imports: [PersistenceModule],
  controllers: [WorkspacesController],
})
export class WorkspacesModule {}
