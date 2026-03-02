import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { Request, Response } from 'express';
import express from 'express';

let cachedServer: express.Application | null = null;

async function bootstrap() {
  if (!cachedServer) {
    const expressApp = express();
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
      { logger: console }
    );

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.setGlobalPrefix('api');
    await app.init();
    cachedServer = expressApp;
  }
  return cachedServer;
}

export default async (req: Request, res: Response) => {
  try {
    const server = await bootstrap();
    server(req, res);
  } catch (error) {
    console.error('Function invocation error:', error);
    res.status(500).json({ error: 'Internal server error', message: String(error) });
  }
};
