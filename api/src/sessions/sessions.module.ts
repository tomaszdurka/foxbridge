import { Module, forwardRef } from '@nestjs/common';
import { PersistenceModule } from '../database/persistence.module';
import { ClaudeModule } from '../claude/claude.module';
import { SessionsController } from './sessions.controller';

@Module({
  imports: [
    PersistenceModule,
    forwardRef(() => ClaudeModule),
  ],
  controllers: [SessionsController],
})
export class SessionsModule {}
