import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { CurrencyService } from './currency.service';
import { CacheService } from '../cache';

describe('CurrencyService', () => {
  let service: CurrencyService;
  let httpService: HttpService;
  let cacheService: CacheService;

  const mockGrinexResponse = {
    timestamp: 1769946184,
    asks: [{ price: '77.3', volume: '64022.555', amount: '4948943.5' }],
    bids: [
      { price: '77.2', volume: '50000.0', amount: '3860000.0' },
      { price: '77.19', volume: '30000.0', amount: '2315700.0' },
    ],
  };

  const createAxiosResponse = <T>(data: T): AxiosResponse<T> => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {
      headers: new AxiosHeaders(),
    } as InternalAxiosRequestConfig,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrencyService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CurrencyService>(CurrencyService);
    httpService = module.get<HttpService>(HttpService);
    cacheService = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateRate', () => {
    it('should subtract 0.10 from bid price', () => {
      const bidPrice = 77.2;
      const result = service.calculateRate(bidPrice);
      expect(result).toBe(77.1);
    });

    it('should handle decimal precision correctly', () => {
      const bidPrice = 77.25;
      const result = service.calculateRate(bidPrice);
      expect(result).toBe(77.15);
    });

    it('should round to 2 decimal places', () => {
      const bidPrice = 77.333;
      const result = service.calculateRate(bidPrice);
      // 77.333 - 0.10 = 77.233, rounded to 77.23
      expect(result).toBe(77.23);
    });

    it('should handle low bid price', () => {
      const bidPrice = 0.15;
      const result = service.calculateRate(bidPrice);
      expect(result).toBe(0.05);
    });
  });

  describe('fetchExchangeRate', () => {
    it('should fetch and return exchange rate from Grinex API', async () => {
      jest.spyOn(httpService, 'get').mockReturnValue(of(createAxiosResponse(mockGrinexResponse)));

      const result = await service.fetchExchangeRate();

      expect(result.originalBid).toBe(77.2);
      expect(result.rate).toBe(77.1); // 77.2 - 0.10
      expect(result.timestamp).toBe(1769946184);
      expect(result.fromCache).toBe(false);
    });

    it('should throw error when no bids available', async () => {
      const emptyBidsResponse = {
        ...mockGrinexResponse,
        bids: [],
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(createAxiosResponse(emptyBidsResponse)));

      await expect(service.fetchExchangeRate()).rejects.toThrow('No bids available in order book');
    });

    it('should throw error when bids is undefined', async () => {
      const noBidsResponse = {
        timestamp: 1769946184,
        asks: [],
        bids: undefined as unknown as { price: string; volume: string; amount: string }[],
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(createAxiosResponse(noBidsResponse)));

      await expect(service.fetchExchangeRate()).rejects.toThrow('No bids available in order book');
    });

    it('should throw error when bid price is invalid', async () => {
      const invalidPriceResponse = {
        ...mockGrinexResponse,
        bids: [{ price: 'invalid', volume: '50000.0', amount: '3860000.0' }],
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(createAxiosResponse(invalidPriceResponse)));

      await expect(service.fetchExchangeRate()).rejects.toThrow('Invalid bid price: invalid');
    });

    it('should throw error when API request fails', async () => {
      jest.spyOn(httpService, 'get').mockReturnValue(throwError(() => new Error('Network error')));

      await expect(service.fetchExchangeRate()).rejects.toThrow(
        'Failed to fetch exchange rate: Network error'
      );
    });
  });

  describe('getCurrentRate', () => {
    it('should return cached rate if available', async () => {
      const cachedRate = {
        rate: 77.1,
        originalBid: 77.2,
        timestamp: 1769946184,
        fromCache: false,
      };

      jest.spyOn(cacheService, 'get').mockResolvedValue(cachedRate);

      const result = await service.getCurrentRate();

      expect(result.rate).toBe(77.1);
      expect(result.fromCache).toBe(true);
      expect(httpService.get).not.toHaveBeenCalled();
    });

    it('should fetch from API when cache is empty', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(undefined);
      jest.spyOn(httpService, 'get').mockReturnValue(of(createAxiosResponse(mockGrinexResponse)));
      jest.spyOn(cacheService, 'set').mockResolvedValue(undefined);

      const result = await service.getCurrentRate();

      expect(result.rate).toBe(77.1);
      expect(result.fromCache).toBe(false);
      expect(cacheService.set).toHaveBeenCalledWith(
        'currency:usdt_rub_rate',
        expect.objectContaining({ rate: 77.1 }),
        300000 // 5 minutes in ms
      );
    });

    it('should throw error when API fails and cache is empty', async () => {
      jest.spyOn(cacheService, 'get').mockResolvedValue(undefined);
      jest
        .spyOn(httpService, 'get')
        .mockReturnValue(throwError(() => new Error('API unavailable')));

      await expect(service.getCurrentRate()).rejects.toThrow('Failed to fetch exchange rate');
    });
  });

  describe('convertToUsd', () => {
    it('should convert RUB (kopecks) to USD (cents)', () => {
      // 7710 kopecks = 77.10 RUB
      // Rate: 77.1 RUB/USDT
      // Expected: 77.10 / 77.1 = 1.00 USD = 100 cents
      const result = service.convertToUsd(7710, 77.1);
      expect(result).toBe(100);
    });

    it('should handle larger amounts', () => {
      // 771000 kopecks = 7710 RUB
      // Rate: 77.1 RUB/USDT
      // Expected: 7710 / 77.1 = 100 USD = 10000 cents
      const result = service.convertToUsd(771000, 77.1);
      expect(result).toBe(10000);
    });

    it('should round to nearest cent', () => {
      // 10000 kopecks = 100 RUB
      // Rate: 77.1 RUB/USDT
      // Expected: 100 / 77.1 = 1.2970... USD = ~130 cents (rounded)
      const result = service.convertToUsd(10000, 77.1);
      expect(result).toBe(130);
    });

    it('should throw error for zero rate', () => {
      expect(() => service.convertToUsd(10000, 0)).toThrow('Invalid exchange rate');
    });

    it('should throw error for negative rate', () => {
      expect(() => service.convertToUsd(10000, -77.1)).toThrow('Invalid exchange rate');
    });
  });

  describe('refreshRate', () => {
    it('should bypass cache and fetch fresh rate', async () => {
      jest.spyOn(httpService, 'get').mockReturnValue(of(createAxiosResponse(mockGrinexResponse)));
      jest.spyOn(cacheService, 'set').mockResolvedValue(undefined);

      const result = await service.refreshRate();

      expect(result.rate).toBe(77.1);
      expect(result.fromCache).toBe(false);
      expect(cacheService.get).not.toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalled();
    });
  });
});
