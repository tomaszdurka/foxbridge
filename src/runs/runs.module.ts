import { Module } from '@nestjs/common';
import { RunsController } from './runs.controller';
import { ClaudeModule } from '../claude/claude.module';

@Module({
  imports: [ClaudeModule],
  controllers: [RunsController],
})
export class RunsModule {}
