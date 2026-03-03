import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable shutdown hooks for proper cleanup
  app.enableShutdownHooks();

  // Enable CORS for frontend
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('FoxBridge API')
    .setDescription('REST API bridge to Claude CLI with workspace isolation and persistence')
    .setVersion('1.0')
    .addTag('runs', 'Claude run execution and querying')
    .addTag('workspaces', 'Workspace management and querying')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Ensure data directory exists and update schema
  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'foxbridge.db');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const orm = app.get(MikroORM);
  await orm.getSchemaGenerator().updateSchema();

  const port = process.env.PORT || 3100;
  await app.listen(port);

  console.log(`Local Model API listening on port ${port}`);
  console.log(`Swagger documentation available at http://localhost:${port}/api`);
}

bootstrap();
