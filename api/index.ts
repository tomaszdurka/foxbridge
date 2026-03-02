import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { Request, Response } from 'express';
import express from 'express';

const server = express();
let cachedApp: any;

async function bootstrap() {
  if (!cachedApp) {
    const expressAdapter = new ExpressAdapter(server);
    cachedApp = await NestFactory.create(
      AppModule,
      expressAdapter,
      { logger: ['error', 'warn', 'log'] }
    );

    cachedApp.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    cachedApp.setGlobalPrefix('api');
    await cachedApp.init();
  }
  return server;
}

export default async (req: Request, res: Response) => {
  const serverInstance = await bootstrap();
  return serverInstance(req, res);
};
