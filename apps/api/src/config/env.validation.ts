import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // Database
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_NAME: Joi.string().default('store_scraper'),
  DB_USER: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().default('password'),
  DATABASE_URL: Joi.string().optional(),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),

  // API
  API_PORT: Joi.number().default(8080),
  API_HOST: Joi.string().default('0.0.0.0'),

  // Scraper
  SCRAPE_INTERVAL: Joi.number().default(3600),
  SCRAPE_TARGET_URL: Joi.string().uri().default('https://store77.net'),

  // Currency
  GRINEX_API_URL: Joi.string().uri().default('https://grinex.io/api/v1/spot/depth?symbol=usdta7a5'),
  CURRENCY_CACHE_TTL: Joi.number().default(300),

  // Node environment
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
});
