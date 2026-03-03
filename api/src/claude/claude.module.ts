import { Module, forwardRef } from '@nestjs/common';
import { ClaudeService } from './claude.service';
import { PersistenceModule } from '../database/persistence.module';

@Module({
  imports: [PersistenceModule],
  providers: [ClaudeService],
  exports: [ClaudeService],
})
export class ClaudeModule {}
