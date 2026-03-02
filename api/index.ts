import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';

let cachedServer: express.Application | null = null;

async function bootstrap(): Promise<express.Application> {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const server = await bootstrap();
    server(req as any, res as any);
  } catch (error) {
    console.error('Function invocation error:', error);
    res.status(500).json({ error: 'Internal server error', message: String(error) });
  }
}
