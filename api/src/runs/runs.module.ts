import { Module } from '@nestjs/common';
import { RunsController } from './runs.controller';
import { RunsService } from './runs.service';
import { ClaudeModule } from '../claude/claude.module';
import { GeminiModule } from '../gemini/gemini.module';
import { CodexModule } from '../codex/codex.module';
import { PersistenceModule } from '../database/persistence.module';

@Module({
  imports: [
    ClaudeModule,
    GeminiModule,
    CodexModule,
    PersistenceModule,
  ],
  controllers: [RunsController],
  providers: [RunsService],
  exports: [RunsService],
})
export class RunsModule {}
