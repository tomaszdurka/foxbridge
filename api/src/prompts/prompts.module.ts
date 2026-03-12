import { Module } from '@nestjs/common';
import { PromptsController } from './prompts.controller';
import { PersistenceModule } from '../database/persistence.module';

@Module({
  imports: [PersistenceModule],
  controllers: [PromptsController],
})
export class PromptsModule {}
