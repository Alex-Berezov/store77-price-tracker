import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './prisma';
import { CacheModule } from './cache';
import { ScraperModule } from './scraper';
import { CurrencyModule } from './currency';
import { ProductsModule } from './products';
import { CategoriesModule } from './categories';
import { ImagesModule } from './images';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),
    // Rate limiting configuration
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'short',
            ttl: config.get<number>('THROTTLE_TTL', 1000), // 1 second
            limit: config.get<number>('THROTTLE_LIMIT', 10), // 10 requests per second
          },
          {
            name: 'medium',
            ttl: config.get<number>('THROTTLE_MEDIUM_TTL', 10000), // 10 seconds
            limit: config.get<number>('THROTTLE_MEDIUM_LIMIT', 50), // 50 requests per 10 seconds
          },
          {
            name: 'long',
            ttl: config.get<number>('THROTTLE_LONG_TTL', 60000), // 1 minute
            limit: config.get<number>('THROTTLE_LONG_LIMIT', 100), // 100 requests per minute
          },
        ],
      }),
    }),
    PrismaModule,
    CacheModule,
    ScraperModule,
    CurrencyModule,
    ProductsModule,
    CategoriesModule,
    ImagesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply rate limiting globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
