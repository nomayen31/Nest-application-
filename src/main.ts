// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Basic security (optional)
  try {
    app.use(helmet());
  } catch (err) {
    // ignore if helmet not available
  }

  // Enable CORS (customize origin as needed)
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? true,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Optional global prefix (uncomment / change if you want)
  // app.setGlobalPrefix('api');

  // Ensure uploads directory exists and serve it
  const uploadDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory at', uploadDir);
  }
  app.use('/uploads', express.static(uploadDir));

  // Swagger (only non-production)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Prisma Nest API')
      .setDescription('API docs for prisma-nest project')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
    console.log('Swagger available at /api');
  }

  const port = Number(process.env.PORT) || 5000;
  await app.listen(port);
  console.log(`Server listening on port ${port}`);
}

bootstrap().catch(err => {
  console.error('Bootstrap failed', err);
  process.exit(1);
});
