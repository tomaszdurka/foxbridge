import { Module, forwardRef } from '@nestjs/common';
import { ClaudeService } from './claude.service';
import { RunsModule } from '../runs/runs.module';
import { PersistenceModule } from '../database/persistence.module';

@Module({
  imports: [
    forwardRef(() => RunsModule),
    PersistenceModule,
  ],
  providers: [ClaudeService],
  exports: [ClaudeService],
})
export class ClaudeModule {}
