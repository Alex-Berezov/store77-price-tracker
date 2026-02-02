import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CacheService } from '../cache';

/** Grinex API URL for USDT/RUB depth */
const GRINEX_DEPTH_URL = 'https://grinex.io/api/v1/spot/depth?symbol=usdta7a5';

/** Rate discount applied to bid price (in rubles) */
const RATE_DISCOUNT = 0.1;

/** Cache key for exchange rate */
const EXCHANGE_RATE_CACHE_KEY = 'currency:usdt_rub_rate';

/** Cache TTL for exchange rate (5 minutes in milliseconds) */
const EXCHANGE_RATE_CACHE_TTL = 5 * 60 * 1000;

/** Order book entry from Grinex API */
interface OrderBookEntry {
  price: string;
  volume: string;
  amount: string;
}

/** Grinex depth API response */
interface GrinexDepthResponse {
  timestamp: number;
  asks: OrderBookEntry[];
  bids: OrderBookEntry[];
}

/** Exchange rate result */
export interface ExchangeRateResult {
  /** USDT/RUB rate (after discount) */
  rate: number;
  /** Original bid price from exchange */
  originalBid: number;
  /** Timestamp of the rate */
  timestamp: number;
  /** Whether the rate was fetched from cache */
  fromCache: boolean;
}

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly cacheService: CacheService
  ) {}

  /**
   * Fetch exchange rate from Grinex API
   * Gets the first bid price and subtracts 0.10 RUB
   * @returns Exchange rate data
   */
  async fetchExchangeRate(): Promise<ExchangeRateResult> {
    this.logger.debug('Fetching exchange rate from Grinex API...');

    try {
      const response = await firstValueFrom(
        this.httpService.get<GrinexDepthResponse>(GRINEX_DEPTH_URL)
      );

      const { bids, timestamp } = response.data;

      const firstBid = bids?.[0];

      if (!firstBid) {
        throw new Error('No bids available in order book');
      }

      const originalBid = parseFloat(firstBid.price);

      if (isNaN(originalBid)) {
        throw new Error(`Invalid bid price: ${firstBid.price}`);
      }

      const rate = this.calculateRate(originalBid);

      this.logger.log(
        `Exchange rate fetched: ${originalBid} - ${RATE_DISCOUNT} = ${rate} RUB/USDT`
      );

      return {
        rate,
        originalBid,
        timestamp,
        fromCache: false,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to fetch exchange rate: ${message}`);
      throw new Error(`Failed to fetch exchange rate: ${message}`);
    }
  }

  /**
   * Calculate the final rate by subtracting discount from bid price
   * Formula: rate = bid[0].price - 0.10
   * @param bidPrice - Original bid price from exchange
   * @returns Final rate after discount
   */
  calculateRate(bidPrice: number): number {
    // Round to 2 decimal places to avoid floating point issues
    return Math.round((bidPrice - RATE_DISCOUNT) * 100) / 100;
  }

  /**
   * Get current exchange rate with caching
   * First checks Redis cache, falls back to API if not cached
   * @returns Exchange rate data
   */
  async getCurrentRate(): Promise<ExchangeRateResult> {
    // Try to get from cache first
    const cached = await this.cacheService.get<ExchangeRateResult>(EXCHANGE_RATE_CACHE_KEY);

    if (cached) {
      this.logger.debug('Exchange rate retrieved from cache');
      return { ...cached, fromCache: true };
    }

    // Fetch from API and cache
    const result = await this.fetchExchangeRate();

    await this.cacheService.set(EXCHANGE_RATE_CACHE_KEY, result, EXCHANGE_RATE_CACHE_TTL);

    this.logger.debug('Exchange rate cached for 5 minutes');

    return result;
  }

  /**
   * Convert price from RUB to USD
   * @param priceRub - Price in rubles (kopecks)
   * @param rate - Exchange rate (RUB per USDT)
   * @returns Price in USD (cents), rounded to 2 decimal places
   */
  convertToUsd(priceRub: number, rate: number): number {
    if (rate <= 0) {
      throw new Error('Invalid exchange rate');
    }
    // priceRub is in kopecks, rate is RUB/USDT
    // Result: (kopecks / 100) / rate = USD
    // Multiply by 100 to get cents
    const priceUsd = (priceRub / 100 / rate) * 100;
    return Math.round(priceUsd);
  }

  /**
   * Force refresh the exchange rate (bypass cache)
   * @returns Fresh exchange rate data
   */
  async refreshRate(): Promise<ExchangeRateResult> {
    const result = await this.fetchExchangeRate();

    await this.cacheService.set(EXCHANGE_RATE_CACHE_KEY, result, EXCHANGE_RATE_CACHE_TTL);

    this.logger.log('Exchange rate refreshed and cached');

    return result;
  }
}
