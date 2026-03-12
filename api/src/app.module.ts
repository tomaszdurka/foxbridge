import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { RunsModule } from './runs/runs.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { SessionsModule } from './sessions/sessions.module';
import { PromptsModule } from './prompts/prompts.module';
import { PersistenceModule } from './database/persistence.module';
import { LifecycleService } from './lifecycle.service';
import config from './mikro-orm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    MikroOrmModule.forRoot(config),
    PersistenceModule,
    RunsModule,
    WorkspacesModule,
    SessionsModule,
    PromptsModule,
  ],
  providers: [LifecycleService],
})
export class AppModule {}
