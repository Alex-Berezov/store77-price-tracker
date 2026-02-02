import { Controller, Get, Post, Param, Logger, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CurrencyService, ExchangeRateResult } from './currency.service';
import { PrismaService } from '../prisma';

/** Response for product price in USD */
export interface ProductPriceResponse {
  productId: string;
  productName: string;
  priceRub: number;
  priceUsd: number;
  exchangeRate: number;
  fromCache: boolean;
}

@ApiTags('currency')
@Controller('currency')
export class CurrencyController {
  private readonly logger = new Logger(CurrencyController.name);

  constructor(
    private readonly currencyService: CurrencyService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Get current exchange rate
   * Returns cached rate if available, otherwise fetches from API
   */
  @Get('rate')
  @ApiOperation({
    summary: 'Получить текущий курс USDT/RUB',
    description: 'Возвращает актуальный курс из кэша или запрашивает с Grinex API',
  })
  @ApiResponse({ status: 200, description: 'Текущий курс обмена' })
  async getRate(): Promise<ExchangeRateResult> {
    this.logger.log('GET /currency/rate');
    return this.currencyService.getCurrentRate();
  }

  /**
   * Force refresh the exchange rate
   * Bypasses cache and fetches fresh rate from Grinex API
   */
  @Post('refresh')
  @ApiOperation({
    summary: 'Принудительно обновить курс',
    description: 'Обходит кэш и запрашивает свежий курс с Grinex API',
  })
  @ApiResponse({ status: 200, description: 'Обновленный курс обмена' })
  async refreshRate(): Promise<ExchangeRateResult> {
    this.logger.log('POST /currency/refresh');
    return this.currencyService.refreshRate();
  }

  /**
   * Get product price in USD
   * Calculates price using current exchange rate
   */
  @Get('products/:id/price')
  @ApiOperation({
    summary: 'Получить цену товара в USD',
    description: 'Рассчитывает цену товара в USD используя текущий курс',
  })
  @ApiParam({ name: 'id', description: 'ID товара' })
  @ApiResponse({ status: 200, description: 'Цена товара в RUB и USD' })
  @ApiResponse({ status: 404, description: 'Товар не найден' })
  async getProductPrice(@Param('id') id: string): Promise<ProductPriceResponse> {
    this.logger.log(`GET /currency/products/${id}/price`);

    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, finalPrice: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const rateResult = await this.currencyService.getCurrentRate();
    const priceUsdCents = this.currencyService.convertToUsd(product.finalPrice, rateResult.rate);

    return {
      productId: product.id,
      productName: product.name,
      priceRub: product.finalPrice / 100, // Convert from kopecks to rubles
      priceUsd: priceUsdCents / 100, // Convert from cents to dollars
      exchangeRate: rateResult.rate,
      fromCache: rateResult.fromCache,
    };
  }
}
