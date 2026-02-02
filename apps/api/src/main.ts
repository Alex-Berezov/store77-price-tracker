import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Get config service
  const configService = app.get(ConfigService);
  const port = configService.get<number>('API_PORT', 8080);
  const host = configService.get<string>('API_HOST', '0.0.0.0');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Enable CORS
  app.enableCors();

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Store77 Price Tracker API')
    .setDescription(
      'API для парсинга каталога товаров с автоматическим пересчетом цен по актуальному курсу USD'
    )
    .setVersion('1.0')
    .addTag('products', 'Товары')
    .addTag('categories', 'Категории')
    .addTag('currency', 'Курс валют')
    .addTag('scraper', 'Парсер')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(port, host);
  logger.log(`Application is running on: http://${host}:${port}`);
  logger.log(`Swagger documentation: http://${host}:${port}/api/docs`);
}

bootstrap();
