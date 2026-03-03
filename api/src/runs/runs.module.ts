import { Module, forwardRef } from '@nestjs/common';
import { RunsController } from './runs.controller';
import { RunsService } from './runs.service';
import { ClaudeModule } from '../claude/claude.module';
import { PersistenceModule } from '../database/persistence.module';

@Module({
  imports: [
    forwardRef(() => ClaudeModule),
    PersistenceModule,
  ],
  controllers: [RunsController],
  providers: [RunsService],
  exports: [RunsService],
})
export class RunsModule {}
