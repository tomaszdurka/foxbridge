import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Add global prefix for API routes
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3100;
  await app.listen(port);

  console.log(`Local Model API listening on port ${port}`);
}

bootstrap();
