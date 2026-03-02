import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RunsModule } from './runs/runs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    RunsModule,
  ],
})
export class AppModule {}
