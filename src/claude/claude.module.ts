import { Module, forwardRef } from '@nestjs/common';
import { ClaudeService } from './claude.service';
import { RunsModule } from '../runs/runs.module';

@Module({
  imports: [forwardRef(() => RunsModule)],
  providers: [ClaudeService],
  exports: [ClaudeService],
})
export class ClaudeModule {}
