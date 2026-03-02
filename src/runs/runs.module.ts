import { Module, forwardRef } from '@nestjs/common';
import { RunsController } from './runs.controller';
import { RunsService } from './runs.service';
import { ClaudeModule } from '../claude/claude.module';

@Module({
  imports: [forwardRef(() => ClaudeModule)],
  controllers: [RunsController],
  providers: [RunsService],
  exports: [RunsService],
})
export class RunsModule {}
