import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Workspace, Run, RunEvent } from './entities';
import { PersistenceService } from './persistence.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([Workspace, Run, RunEvent]),
  ],
  providers: [PersistenceService],
  exports: [PersistenceService],
})
export class PersistenceModule {}
