import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

  app.use(express.json());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Retrogarage (Back)')
    .setDescription(
      'Back para una aplicación de E-commerce, desarrollada con NestJS, TypeORM y PostgreSQL.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addServer('http://localhost:3002')
    .addServer('https://back-0o27.onrender.com')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const PORT = process.env.PORT || 3002;
  const HOST = process.env.HOST || 'localhost';

  await app.listen(PORT);

  console.log(`Servidor escuchando en puerto ${PORT}`);
}

bootstrap();
