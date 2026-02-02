import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let mockCacheManager: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    clear: jest.Mock;
  };

  beforeEach(async () => {
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      clear: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return cached value when found', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };
      mockCacheManager.get.mockResolvedValue(value);

      const result = await service.get(key);

      expect(result).toEqual(value);
      expect(mockCacheManager.get).toHaveBeenCalledWith(key);
    });

    it('should return undefined when not found', async () => {
      mockCacheManager.get.mockResolvedValue(undefined);

      const result = await service.get('non-existent-key');

      expect(result).toBeUndefined();
    });

    it('should return undefined on error', async () => {
      mockCacheManager.get.mockRejectedValue(new Error('Redis error'));

      const result = await service.get('error-key');

      expect(result).toBeUndefined();
    });
  });

  describe('set', () => {
    it('should set value in cache', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set(key, value);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, value, undefined);
    });

    it('should set value with TTL', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };
      const ttl = 60000;
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set(key, value, ttl);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, value, ttl);
    });

    it('should not throw on error', async () => {
      mockCacheManager.set.mockRejectedValue(new Error('Redis error'));

      await expect(service.set('error-key', 'value')).resolves.not.toThrow();
    });
  });

  describe('del', () => {
    it('should delete key from cache', async () => {
      const key = 'test-key';
      mockCacheManager.del.mockResolvedValue(undefined);

      await service.del(key);

      expect(mockCacheManager.del).toHaveBeenCalledWith(key);
    });

    it('should not throw on error', async () => {
      mockCacheManager.del.mockRejectedValue(new Error('Redis error'));

      await expect(service.del('error-key')).resolves.not.toThrow();
    });
  });

  describe('reset', () => {
    it('should clear all cache', async () => {
      mockCacheManager.clear.mockResolvedValue(undefined);

      await service.reset();

      expect(mockCacheManager.clear).toHaveBeenCalled();
    });

    it('should not throw on error', async () => {
      mockCacheManager.clear.mockRejectedValue(new Error('Redis error'));

      await expect(service.reset()).resolves.not.toThrow();
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      const key = 'test-key';
      const cachedValue = { data: 'cached' };
      mockCacheManager.get.mockResolvedValue(cachedValue);

      const factory = jest.fn().mockResolvedValue({ data: 'new' });
      const result = await service.getOrSet(key, factory);

      expect(result).toEqual(cachedValue);
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory and cache result if not cached', async () => {
      const key = 'test-key';
      const newValue = { data: 'new' };
      mockCacheManager.get.mockResolvedValue(undefined);
      mockCacheManager.set.mockResolvedValue(undefined);

      const factory = jest.fn().mockResolvedValue(newValue);
      const result = await service.getOrSet(key, factory, 60000);

      expect(result).toEqual(newValue);
      expect(factory).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalledWith(key, newValue, 60000);
    });
  });
});
