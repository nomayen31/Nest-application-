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

  // 🔍 TEMP DEBUG: see what Authorization header Swagger/Postman sends
  app.use((req, _res, next) => {
    console.log(
      `[${req.method}] ${req.path} - Authorization:`,
      req.headers['authorization'],
    );
    next();
  });

  // 🛡 Basic security
  try {
    app.use(helmet());
  } catch (err) {
    console.warn('Helmet not applied:', err?.message ?? err);
  }

  // 🌐 CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });

  // ✅ Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // 📁 Static uploads
  const uploadDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory at', uploadDir);
  }
  app.use('/uploads', express.static(uploadDir));

  // 📘 Swagger (disabled in production)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Prisma Nest API')
      .setDescription('API docs for prisma-nest project')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          in: 'header',
        },
        'access-token', 
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        persistAuthorization: true, // keep token after refresh
      },
    });

    console.log('Swagger available at http://localhost:5000/api');
  }

  const port = Number(process.env.PORT) || 5000;
  await app.listen(port);
  console.log(`Server listening on http://localhost:${port}`);
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed', err);
  process.exit(1);
});
